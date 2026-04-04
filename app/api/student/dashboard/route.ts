import { prisma } from "@/lib/prisma"
import { getSubjectsForDepartmentYear } from "@/lib/curriculum"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance

type AttendanceRow = {
  id: string
  status: "PRESENT" | "ABSENT" | "EXCUSED"
  createdAt: Date
  sessionId: string
  session: {
    subject: string
    createdAt: Date
  }
}

type Status = "GOOD" | "WARNING" | "CRITICAL"

function calculatePercentage(present: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((present / total) * 100)
}

function getStatus(percentage: number): Status {
  if (percentage >= 75) {
    return "GOOD"
  }

  if (percentage >= 50) {
    return "WARNING"
  }

  return "CRITICAL"
}

function classesNeededFor75(present: number, total: number) {
  // (present + x) / (total + x) >= 0.75
  const needed = 3 * total - 4 * present
  return Math.max(0, needed)
}

function projectedPercentage(present: number, total: number, attendNext = 0, missNext = 0) {
  const nextTotal = total + attendNext + missNext
  const nextPresent = present + attendNext
  return calculatePercentage(nextPresent, nextTotal)
}

function normalizeSubject(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

export async function GET() {
  const { userId: clerkUserId } = await auth()

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      role: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          year: true,
          rollNo: true,
          isActive: true,
        },
      },
    },
  })

  if (!user || user.role !== "STUDENT" || !user.student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  const student = user.student
  const effectiveFrom = user.createdAt

  if (!student.isActive) {
    // Instead of throwing 403 and returning early, we just add a flag so the UI can show the banner.
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const now = new Date()

  const [eligibleSessions, attendances] = await Promise.all([
    prisma.session.findMany({
      where: {
        department: student.department,
        year: student.year,
        createdAt: { gte: effectiveFrom, lte: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        createdAt: true,
      },
    }),
    attendanceModel.findMany({
      where: {
        studentId: student.id,
        session: {
          createdAt: { gte: effectiveFrom, lte: now },
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        sessionId: true,
        session: {
          select: {
            subject: true,
            createdAt: true,
          },
        },
      },
    }),
  ])

  const typedAttendances = attendances as AttendanceRow[]

  const configuredSubjects = getSubjectsForDepartmentYear(student.department, student.year)
  const canonicalSubjectByNormalized = new Map(
    configuredSubjects.map((subject) => [normalizeSubject(subject), subject])
  )

  const eligibleCurriculumSessions = eligibleSessions
    .map((session) => {
      const canonicalSubject = canonicalSubjectByNormalized.get(normalizeSubject(session.subject))
      if (!canonicalSubject) {
        return null
      }

      return {
        ...session,
        subject: canonicalSubject,
      }
    })
    .filter((session): session is { id: string; subject: string; createdAt: Date } => session !== null)

  const eligibleCurriculumSessionIds = new Set(eligibleCurriculumSessions.map((session) => session.id))

  const typedCurriculumAttendances = typedAttendances
    .filter((attendance) => eligibleCurriculumSessionIds.has(attendance.sessionId))
    .map((attendance) => {
      const canonicalSubject = canonicalSubjectByNormalized.get(normalizeSubject(attendance.session.subject))
      return {
        ...attendance,
        session: {
          ...attendance.session,
          subject: canonicalSubject ?? attendance.session.subject,
        },
      }
    })

  const totalSessions = eligibleCurriculumSessions.length
  const totalAttended = typedCurriculumAttendances.filter((attendance) => attendance.status === "PRESENT").length
  const totalExcused = typedCurriculumAttendances.filter((attendance) => attendance.status === "EXCUSED").length
  const effectiveTotalSessions = totalSessions

  const attendancePercentage = calculatePercentage(totalAttended, effectiveTotalSessions)
  const neededForOverall75 = classesNeededFor75(totalAttended, effectiveTotalSessions)

  const attendanceBySessionId = new Map<string, AttendanceRow>(
    typedCurriculumAttendances.map((attendance) => [attendance.sessionId, attendance])
  )

  const history = eligibleCurriculumSessions.slice(0, 40).map((session) => {
    const attendance = attendanceBySessionId.get(session.id)

    const status = attendance?.status === "PRESENT"
      ? "PRESENT"
      : attendance?.status === "EXCUSED"
        ? "EXCUSED"
        : "ABSENT"

    return {
      sessionId: session.id,
      subject: session.subject,
      date: session.createdAt,
      status,
      markedAt: attendance?.createdAt ?? null,
    }
  })

  const todaySessions = history
    .filter((entry) => new Date(entry.date).getTime() >= today.getTime())
    .map((entry) => ({
      sessionId: entry.sessionId,
      subject: entry.subject,
      date: entry.date,
      status: entry.status === "PRESENT" ? "PRESENT" : "NOT_MARKED",
    }))

  const subjectStats = new Map<string, { present: number; total: number; excused: number }>()

  eligibleCurriculumSessions.forEach((session) => {
    if (!subjectStats.has(session.subject)) {
      subjectStats.set(session.subject, { present: 0, total: 0, excused: 0 })
    }
    const stat = subjectStats.get(session.subject)
    if (stat) {
      stat.total += 1
    }
  })

  typedCurriculumAttendances.forEach((attendance) => {
    const stat = subjectStats.get(attendance.session.subject)
    if (!stat) return
    if (attendance.status === "PRESENT") {
      stat.present += 1
    } else if (attendance.status === "EXCUSED") {
      stat.excused += 1
    }
  })

  const subjects = Array.from(subjectStats.entries())
    .map(([subject, stat]) => {
      const effectiveTotal = stat.total
      const percentage = calculatePercentage(stat.present, effectiveTotal)
      const neededToRecover = classesNeededFor75(stat.present, effectiveTotal)

      return {
        subject,
        present: stat.present,
        total: stat.total,
        percentage,
        status: getStatus(percentage),
        neededToRecover,
      }
    })
    .sort((a, b) => a.percentage - b.percentage)

  const atRiskSubjects = subjects.filter((subject) => subject.percentage < 75)

  const attendNextFour = projectedPercentage(totalAttended, effectiveTotalSessions, 4, 0)
  const attendToRecover = projectedPercentage(totalAttended, effectiveTotalSessions, neededForOverall75, 0)
  const missNextTwo = projectedPercentage(totalAttended, effectiveTotalSessions, 0, 2)

  const actionPlan =
    neededForOverall75 > 0
      ? `You need ${neededForOverall75} more consecutive attendances to reach 75%.`
      : "You are at or above 75%. Keep attending regularly to stay safe."

  return NextResponse.json({
    student,
    summary: {
      attendancePercentage,
      totalAttended,
      totalSessions: effectiveTotalSessions,
      status: getStatus(attendancePercentage),
      actionPlan,
      neededForOverall75,
      totalScheduledSessions: totalSessions,
      totalExcused,
    },
    warning: {
      atRiskCount: atRiskSubjects.length,
      atRiskSubjects,
    },
    today: todaySessions,
    subjects,
    history,
    predictions: totalSessions > 0 ? {
      attendNextFour,
      attendToRecover,
      missNextTwo,
      neededForOverall75,
    } : null,
    isDeactivated: !student.isActive,
  })
}
