import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const ALLOWED_DEPARTMENTS = new Set(["BBA", "BCA"])
const ALLOWED_YEARS = new Set([1, 2, 3])

function calculatePercentage(present: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((present / total) * 100)
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actor = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      role: true,
      teacher: {
        select: {
          department: true,
        },
      },
    },
  })

  if (actor?.role !== "TEACHER" || !actor.teacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payload = (await req.json()) as {
    department?: string
    year?: number
    threshold?: number
  }

  const department = String(payload.department ?? actor.teacher.department)
    .trim()
    .toUpperCase()
  const year = Number(payload.year)
  const threshold = Number(payload.threshold ?? 75)

  if (!ALLOWED_DEPARTMENTS.has(department)) {
    return NextResponse.json({ error: "department must be BBA or BCA" }, { status: 400 })
  }

  if (!ALLOWED_YEARS.has(year)) {
    return NextResponse.json({ error: "year must be 1, 2 or 3" }, { status: 400 })
  }

  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 100) {
    return NextResponse.json({ error: "threshold must be between 1 and 100" }, { status: 400 })
  }

  const [students, sessions] = await Promise.all([
    prisma.student.findMany({
      where: {
        department,
        year,
        isActive: true,
      },
      orderBy: [{ rollNo: "asc" }],
      select: {
        id: true,
        fullName: true,
        email: true,
        rollNo: true,
        user: {
          select: {
            createdAt: true,
          },
        },
      },
    }),
    prisma.session.findMany({
      where: {
        createdBy: actor.id,
        department,
        year,
      },
      select: {
        id: true,
        createdAt: true,
      },
    }),
  ])

  const sessionIds = sessions.map((session) => session.id)
  const sessionIdsSet = new Set(sessionIds)

  const attendances =
    sessionIds.length > 0 && students.length > 0
      ? await prisma.attendance.findMany({
          where: {
            studentId: { in: students.map((student) => student.id) },
            sessionId: { in: sessionIds },
          },
          select: {
            studentId: true,
            sessionId: true,
            status: true,
          },
        })
      : []

  const attendanceByStudent = new Map<string, Array<{ sessionId: string; status: "PRESENT" | "ABSENT" | "EXCUSED" }>>()

  attendances.forEach((attendance) => {
    if (!sessionIdsSet.has(attendance.sessionId)) {
      return
    }

    const existing = attendanceByStudent.get(attendance.studentId) ?? []
    existing.push({
      sessionId: attendance.sessionId,
      status: attendance.status,
    })
    attendanceByStudent.set(attendance.studentId, existing)
  })

  const atRiskStudents = students
    .map((student) => {
      const rows = attendanceByStudent.get(student.id) ?? []
      const eligibleSessionsCount = sessions.filter(
        (session) => session.createdAt.getTime() >= student.user.createdAt.getTime()
      ).length

      const present = rows.filter((row) => row.status === "PRESENT").length
      const excused = rows.filter((row) => row.status === "EXCUSED").length
      const totalConsidered = Math.max(0, eligibleSessionsCount - excused)
      const attendancePercentage = calculatePercentage(present, totalConsidered)

      return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        rollNo: student.rollNo,
        attendancePercentage,
        present,
        totalConsidered,
      }
    })
    .filter((student) => student.attendancePercentage < threshold)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage)

  const recipients = atRiskStudents
    .map((student) => student.email?.trim().toLowerCase() ?? "")
    .filter((email) => email.length > 0)

  const bcc = recipients.join(",")
  const subject = `${department} Year ${year}: Attendance Warning (Below ${threshold}%)`
  const body = [
    `Dear Student,`,
    "",
    `Your attendance is currently below ${threshold}%.`,
    "Please attend upcoming classes regularly to improve your record.",
    "",
    "Regards,",
    "Class Teacher",
  ].join("\n")

  const mailtoUrl = recipients.length
    ? `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null

  return NextResponse.json({
    department,
    year,
    threshold,
    totalStudents: students.length,
    totalSessions: sessions.length,
    atRiskCount: atRiskStudents.length,
    recipientCount: recipients.length,
    atRiskStudents,
    mailtoUrl,
  })
}
