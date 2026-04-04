import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance

// Fallback campus geo-fence for legacy sessions that don't store teacher location.
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
      geofenceLatitude: true,
      geofenceLongitude: true,
      geofenceRadiusMeters: true,
      expiresAt: true,
    },
  })

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Session expired" }, { status: 410 })
  }

  const sessionDepartment = session.department.trim().toUpperCase()
  const studentDepartment = student.department.trim().toUpperCase()

  if (sessionDepartment !== studentDepartment || session.year !== student.year) {
    return NextResponse.json(
      {
        error: "This QR session belongs to a different class/year for your account.",
        errorCode: "SESSION_CLASS_MISMATCH",
      },
      { status: 403 }
    )
  }

  // Geo-fence: prefer per-session teacher location; fallback to campus coordinates for legacy sessions.
  const hasSessionCoordinates =
    typeof session.geofenceLatitude === "number" && typeof session.geofenceLongitude === "number"
  const hasCampusCoordinates = CAMPUS_LATITUDE !== 0 && CAMPUS_LONGITUDE !== 0

  if (hasSessionCoordinates || hasCampusCoordinates) {
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

    const targetLatitude = hasSessionCoordinates ? session.geofenceLatitude! : CAMPUS_LATITUDE
    const targetLongitude = hasSessionCoordinates ? session.geofenceLongitude! : CAMPUS_LONGITUDE
    const geofenceRadius =
      hasSessionCoordinates && Number.isFinite(session.geofenceRadiusMeters)
        ? Math.max(5, session.geofenceRadiusMeters)
        : GEOFENCE_RADIUS_METERS

    const distance = distanceInMeters(latitude, longitude, targetLatitude, targetLongitude)

    if (distance > geofenceRadius) {
      const remaining = Math.max(0, distance - geofenceRadius)
      return NextResponse.json(
        {
          error: hasSessionCoordinates
            ? "You appear to be outside the teacher's classroom range."
            : "You appear to be outside the college campus. Attendance can only be marked from within campus.",
          errorCode: "GEOFENCE_VIOLATION",
          distanceMeters: Math.round(distance),
          radiusMeters: Math.round(geofenceRadius),
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
