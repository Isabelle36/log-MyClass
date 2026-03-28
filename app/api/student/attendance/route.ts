import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any

// Campus geo-fence configuration.
// Set these in your env, e.g.:
// CAMPUS_LATITUDE=12.9716
// CAMPUS_LONGITUDE=77.5946
// GEOFENCE_RADIUS_METERS=40
const CAMPUS_LATITUDE = Number(process.env.CAMPUS_LATITUDE ?? "0")
const CAMPUS_LONGITUDE = Number(process.env.CAMPUS_LONGITUDE ?? "0")
const GEOFENCE_RADIUS_METERS = Number(process.env.GEOFENCE_RADIUS_METERS ?? "150")

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371_000 // metres
  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
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

  // Geo-fence: require valid coordinates and ensure student is near campus
  const hasCampusCoordinates = CAMPUS_LATITUDE !== 0 && CAMPUS_LONGITUDE !== 0

  if (hasCampusCoordinates) {
    if (!latitude || !longitude) {
      return NextResponse.json(
        {
          error:
            "Location access is required to mark attendance. Please enable location and try again.",
          errorCode: "LOCATION_REQUIRED",
        },
        { status: 400 }
      )
    }

    const distance = distanceInMeters(latitude, longitude, CAMPUS_LATITUDE, CAMPUS_LONGITUDE)

    if (distance > GEOFENCE_RADIUS_METERS) {
      const remaining = Math.max(0, distance - GEOFENCE_RADIUS_METERS)
      return NextResponse.json(
        {
          error:
            "You appear to be outside the college campus. Attendance can only be marked from within campus.",
          errorCode: "GEOFENCE_VIOLATION",
          distanceMeters: Math.round(distance),
          radiusMeters: Math.round(GEOFENCE_RADIUS_METERS),
          remainingMeters: Math.round(remaining),
        },
        { status: 403 }
      )
    }
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
