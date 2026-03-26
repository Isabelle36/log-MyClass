import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any

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
    },
  })

  if (actor?.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const student = await prisma.student.findUnique({
    where: { userId: actor.id },
    select: {
      id: true,
      fullName: true,
      isActive: true,
      department: true,
      year: true,
    },
  })

  if (!student || !student.isActive) {
    return NextResponse.json(
      {
        error:
          "Your account is restricted. You cannot make attendance right now. Please contact your dean to reactivate your account.",
        errorCode: "ACCOUNT_RESTRICTED",
      },
      { status: 403 }
    )
  }

  const body = (await req.json()) as {
    sessionId?: string
    latitude?: number
    longitude?: number
  }

  const sessionId = String(body.sessionId ?? "").trim()
  const latitude = typeof body.latitude === "number" ? body.latitude : 0
  const longitude = typeof body.longitude === "number" ? body.longitude : 0

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      department: true,
      year: true,
      expiresAt: true,
    },
  })

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Session expired" }, { status: 410 })
  }

  if (session.department !== student.department || session.year !== student.year) {
    return NextResponse.json({ error: "Session not valid for this student" }, { status: 403 })
  }

  const existing = await attendanceModel.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ error: "Attendance already marked" }, { status: 409 })
  }

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null

  const userAgent = req.headers.get("user-agent")

  await attendanceModel.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      status: "PRESENT",
      latitude,
      longitude,
      ipAddress,
      userAgent,
    },
  })

  return NextResponse.json({
    success: true,
    message: "Attendance marked",
  })
}
