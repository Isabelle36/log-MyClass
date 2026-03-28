import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json()) as {
    studentId?: string
    fromDate?: string
    toDate?: string
  }

  const studentId = body.studentId?.trim() ?? ""
  const fromRaw = body.fromDate?.trim() ?? ""
  const toRaw = body.toDate?.trim() ?? ""

  if (!studentId || !fromRaw || !toRaw) {
    return NextResponse.json({ error: "studentId, fromDate and toDate are required" }, { status: 400 })
  }

  const from = new Date(fromRaw)
  const to = new Date(toRaw)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
  }

  // normalise to cover whole days
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)

  try {
    // In this system, "ABSENT" is represented as the
    // absence of any attendance row for a given
    // (session, student) pair. To mark a range as
    // excused, we create EXCUSED rows for all sessions
    // in the date range where the student has no
    // existing attendance yet.

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        department: true,
        year: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const sessions = await prisma.session.findMany({
      where: {
        department: student.department,
        year: student.year,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({ updatedCount: 0 })
    }

    const sessionIds = sessions.map((session) => session.id)

    const existing = await attendanceModel.findMany({
      where: {
        studentId,
        sessionId: { in: sessionIds },
      },
      select: {
        sessionId: true,
        status: true,
      },
    })

    const existingBySessionId = new Map<string, { sessionId: string; status: string }>()
    for (const row of existing as Array<{ sessionId: string; status: string }>) {
      existingBySessionId.set(row.sessionId, row)
    }

    const toCreate: Array<{ sessionId: string; studentId: string; status: "EXCUSED" }> = []

    for (const sessionId of sessionIds) {
      const row = existingBySessionId.get(sessionId)
      // Only create EXCUSED records where there is no
      // attendance yet. PRESENT or existing EXCUSED
      // rows are left untouched.
      if (!row) {
        toCreate.push({ sessionId, studentId, status: "EXCUSED" })
      }
    }

    if (toCreate.length === 0) {
      return NextResponse.json({ updatedCount: 0 })
    }

    const result = await attendanceModel.createMany({
      data: toCreate,
      skipDuplicates: true,
    })

    return NextResponse.json({
      updatedCount: result.count ?? toCreate.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attendance records"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
