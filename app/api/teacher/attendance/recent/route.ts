import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance

const RECENT_DAYS = 7
const MAX_SESSIONS = 12

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actor = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      role: true,
    },
  })

  if (actor?.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const parsedLimit = Number(url.searchParams.get("limit") ?? "80")
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 10), 300) : 80

  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000)

  const sessions = await prisma.session.findMany({
    where: {
      createdBy: actor.id,
      createdAt: { gte: since },
      expiresAt: { lte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_SESSIONS,
    select: {
      id: true,
      subject: true,
      department: true,
      year: true,
      createdAt: true,
    },
  })

  if (sessions.length === 0) {
    return NextResponse.json({ rows: [], total: 0, presentCount: 0, absentCount: 0 })
  }

  const sessionIds = sessions.map((session) => session.id)
  const classPairs = Array.from(new Set(sessions.map((session) => `${session.department}|${session.year}`)))

  const students = await prisma.student.findMany({
    where: {
      OR: [
        {
          isActive: true,
          OR: classPairs.map((pair) => {
            const [department, year] = pair.split("|")
            return {
              department,
              year: Number(year),
            }
          }),
        },
        {
          attendances: {
            some: {
              sessionId: { in: sessionIds },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      rollNo: true,
      department: true,
      year: true,
    },
  })

  const presentAttendances = (await attendanceModel.findMany({
    where: {
      sessionId: { in: sessionIds },
      status: "PRESENT",
    },
    select: {
      id: true,
      sessionId: true,
      studentId: true,
      createdAt: true,
    },
  })) as Array<{
    id: string
    sessionId: string
    studentId: string
    createdAt: Date
  }>

  const attendanceMap = new Map<string, { id: string; createdAt: Date }>()
  for (const attendance of presentAttendances) {
    attendanceMap.set(`${attendance.sessionId}:${attendance.studentId}`, {
      id: attendance.id,
      createdAt: attendance.createdAt,
    })
  }

  const studentsByClass = new Map<string, typeof students>()
  for (const student of students) {
    const key = `${student.department}|${student.year}`
    const existing = studentsByClass.get(key)
    if (existing) {
      existing.push(student)
    } else {
      studentsByClass.set(key, [student])
    }
  }

  const rows: Array<{
    id: string
    status: "PRESENT" | "ABSENT"
    sessionCreatedAt: Date
    markedAt: Date | null
    session: {
      id: string
      subject: string
      department: string
      year: number
    }
    student: {
      id: string
      fullName: string
      email: string | null
      rollNo: number
      department: string
      year: number
    }
  }> = []

  for (const session of sessions) {
    const key = `${session.department}|${session.year}`
    const classStudents = studentsByClass.get(key) ?? []

    for (const student of classStudents) {
      const attendance = attendanceMap.get(`${session.id}:${student.id}`)

      rows.push({
        id: attendance?.id ?? `${session.id}:${student.id}`,
        status: attendance ? "PRESENT" : "ABSENT",
        sessionCreatedAt: session.createdAt,
        markedAt: attendance?.createdAt ?? null,
        session: {
          id: session.id,
          subject: session.subject,
          department: session.department,
          year: session.year,
        },
        student: {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          rollNo: student.rollNo,
          department: student.department,
          year: student.year,
        },
      })
    }
  }

  rows.sort((a, b) => {
    const sessionDiff = b.sessionCreatedAt.getTime() - a.sessionCreatedAt.getTime()
    if (sessionDiff !== 0) return sessionDiff

    const markedTimeA = a.markedAt?.getTime() ?? 0
    const markedTimeB = b.markedAt?.getTime() ?? 0
    return markedTimeB - markedTimeA
  })

  const trimmed = rows.slice(0, limit)
  const presentCount = trimmed.filter((row) => row.status === "PRESENT").length
  const absentCount = trimmed.length - presentCount

  return NextResponse.json({
    rows: trimmed,
    total: trimmed.length,
    presentCount,
    absentCount,
  })
}
