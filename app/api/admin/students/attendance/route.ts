import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any
const userModel = prisma.user as any

function getNamePartsCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function pickFullerDisplayName(dbName: string | null | undefined, clerkName: string | undefined) {
  const normalizedDb = typeof dbName === "string" ? dbName.trim() : ""
  const normalizedClerk = typeof clerkName === "string" ? clerkName.trim() : ""

  if (!normalizedDb && !normalizedClerk) {
    return ""
  }
  if (!normalizedDb) {
    return normalizedClerk
  }
  if (!normalizedClerk) {
    return normalizedDb
  }

  return getNamePartsCount(normalizedDb) >= getNamePartsCount(normalizedClerk)
    ? normalizedDb
    : normalizedClerk
}

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const studentId = url.searchParams.get("studentId")?.trim() ?? ""
  const department = url.searchParams.get("department")?.trim() ?? ""
  const yearRaw = url.searchParams.get("year")?.trim() ?? ""

  const year = Number(yearRaw)
  let typedLogs: Array<{
    id: string
    status: "PRESENT" | "ABSENT" | "EXCUSED"
    createdAt: Date
    session: {
      id: string
      subject: string
      department: string
      year: number
      createdBy: string
      createdAt: Date
      expiresAt: Date
    }
    student: {
      id: string
      fullName: string
      email: string | null
      department: string
      year: number
      rollNo: number
    }
  }>

  if (studentId) {
    // For a specific student, build a full history similar to the
    // student dashboard: every scheduled class for their
    // department/year, marked as PRESENT / EXCUSED / ABSENT.

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        year: true,
        rollNo: true,
        user: {
          select: {
            createdAt: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const effectiveFrom = student.user?.createdAt ?? new Date(0)
    const now = new Date()

    const sessions = await prisma.session.findMany({
      where: {
        department: student.department,
        year: student.year,
        createdAt: { gte: effectiveFrom, lte: now },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        id: true,
        subject: true,
        department: true,
        year: true,
        createdBy: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({ count: 0, logs: [] })
    }

    const sessionIds = sessions.map((session) => session.id)

    const attendances = await attendanceModel.findMany({
      where: {
        studentId,
        sessionId: { in: sessionIds },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        sessionId: true,
      },
    })

    const attendanceBySessionId = new Map<
      string,
      { id: string; status: "PRESENT" | "ABSENT" | "EXCUSED"; createdAt: Date; sessionId: string }
    >()

    for (const row of attendances as Array<{
      id: string
      status: "PRESENT" | "ABSENT" | "EXCUSED"
      createdAt: Date
      sessionId: string
    }>) {
      attendanceBySessionId.set(row.sessionId, row)
    }

    const studentInfo = {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      department: student.department,
      year: student.year,
      rollNo: student.rollNo,
    }

    typedLogs = sessions.map((session) => {
      const attendance = attendanceBySessionId.get(session.id)

      const status: "PRESENT" | "ABSENT" | "EXCUSED" =
        attendance?.status === "PRESENT"
          ? "PRESENT"
          : attendance?.status === "EXCUSED"
            ? "EXCUSED"
            : "ABSENT"

      return {
        id: attendance?.id ?? `${session.id}:${student.id}`,
        status,
        createdAt: session.createdAt,
        session,
        student: studentInfo,
      }
    })
  } else {
    // For all students: build full history like per-student view
    const now = new Date()
    const effectiveFrom = new Date(0) // Adjust if needed, e.g., academic year start

    let whereClause: any = {
      createdAt: { gte: effectiveFrom, lte: now },
    }

    if (department) {
      whereClause.department = { equals: department, mode: "insensitive" }
    }
    if (yearRaw && !Number.isNaN(year)) {
      whereClause.year = year
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        id: true,
        subject: true,
        department: true,
        year: true,
        createdBy: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({ count: 0, logs: [] })
    }

    const sessionIds = sessions.map((session) => session.id)

    // Get unique students relevant to these sessions' dept/year combos
    const sessionDeptsYears = [...new Set(sessions.map(s => `${s.department}-${s.year}`))]
    const relevantStudents = await prisma.student.findMany({
      where: {
        OR: [
          {
            isActive: true,
            OR: sessionDeptsYears.map(dy => {
              const [dept, y] = dy.split('-')
              return { department: { equals: dept, mode: "insensitive" }, year: Number(y) }
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
        department: true,
        year: true,
        rollNo: true,
      },
    })

    // Fetch existing attendances for these sessions
    const attendances = await attendanceModel.findMany({
      where: {
        sessionId: { in: sessionIds },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        sessionId: true,
        studentId: true,
      },
    })

    const attendanceBySessionStudent = new Map<string, { id: string; status: "PRESENT" | "ABSENT" | "EXCUSED"; createdAt: Date; sessionId: string; studentId: string }>()
    for (const row of attendances as any[]) {
      const key = `${row.sessionId}:${row.studentId}`
      attendanceBySessionStudent.set(key, row)
    }

    // Generate full logs
    const allCombos: Array<{
      session: typeof sessions[0]
      student: typeof relevantStudents[0]
    }> = []

    for (const session of sessions) {
      for (const student of relevantStudents.filter(s => s.department.toUpperCase() === session.department.toUpperCase() && s.year === session.year)) {
        allCombos.push({ session, student })
      }
    }

    typedLogs = allCombos.map(({ session, student }) => {
      const key = `${session.id}:${student.id}`
      const attendance = attendanceBySessionStudent.get(key)

      const status: "PRESENT" | "ABSENT" | "EXCUSED" =
        attendance?.status === "PRESENT"
          ? "PRESENT"
          : attendance?.status === "EXCUSED"
            ? "EXCUSED"
            : "ABSENT"

      return {
        id: attendance?.id ?? `${session.id}:${student.id}`,
        status,
        createdAt: session.createdAt,
        session,
        student,
      }
    })
  }

  const creatorIds = Array.from(new Set(typedLogs.map((log) => log.session.createdBy))) as string[]
  const creators =
    creatorIds.length > 0
      ? await userModel.findMany({
          where: { id: { in: creatorIds } },
          select: {
            id: true,
            clerkUserId: true,
            email: true,
            teacher: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        })
      : []

  const getClerkDisplayName = (clerkUser: any) => {
    const metadata = clerkUser?.publicMetadata as Record<string, unknown> | undefined
    const fullNameFromMetadata = metadata?.fullName || metadata?.full_name || metadata?.name
    
    if (typeof fullNameFromMetadata === "string" && fullNameFromMetadata.trim()) {
      return fullNameFromMetadata.trim()
    }

    const composed = [clerkUser?.firstName?.trim(), clerkUser?.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim()

    return composed || null
  }

  const client = await clerkClient()
  const creatorClerkIds = Array.from(
    new Set(
      (creators as Array<any>)
        .map((creator) => creator.clerkUserId)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  )

  const clerkNameById = new Map<string, string>()
  await Promise.all(
    creatorClerkIds.map(async (clerkUserId) => {
      try {
        const clerkUser = await client.users.getUser(clerkUserId)
        const displayName = getClerkDisplayName(clerkUser)
        if (displayName) {
          clerkNameById.set(clerkUserId, displayName)
        }
      } catch {
        // Keep DB value if Clerk lookup fails.
      }
    })
  )

  const creatorById = new Map<string, any>(creators.map((creator: any) => [creator.id, creator]))

  const enrichedLogs = typedLogs.map((log) => {
    const creator = creatorById.get(log.session.createdBy) as any
    const clerkDisplayName =
      typeof creator?.clerkUserId === "string" ? clerkNameById.get(creator.clerkUserId) : undefined
    const fullerName = pickFullerDisplayName(creator?.teacher?.fullName, clerkDisplayName)
    const teacherName = fullerName || creator?.teacher?.email || creator?.email || "Unknown"

    return {
      ...log,
      session: {
        ...log.session,
        teacherName,
      },
    }
  })

  return NextResponse.json({ count: enrichedLogs.length, logs: enrichedLogs })
}
