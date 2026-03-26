import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any

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
  const sessionId = url.searchParams.get("sessionId")?.trim()

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      createdBy: actor.id,
    },
    select: {
      id: true,
      subject: true,
      department: true,
      year: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const [presentCount, totalStudents, attendees] = await Promise.all([
    attendanceModel.count({
      where: {
        sessionId: session.id,
        status: "PRESENT",
      },
    }),
    prisma.student.count({
      where: {
        department: session.department,
        year: session.year,
        isActive: true,
      },
    }),
    attendanceModel.findMany({
      where: {
        sessionId: session.id,
        status: "PRESENT",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        student: {
          select: {
            fullName: true,
            rollNo: true,
            email: true,
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    session,
    presentCount,
    totalStudents,
    attendees,
    isExpired: session.expiresAt.getTime() <= Date.now(),
  })
}
