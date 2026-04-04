import { prisma } from "@/lib/prisma"
import { getSubjectsForDepartmentYear } from "@/lib/curriculum"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const ALLOWED_DEPARTMENTS = new Set(["BCA", "BBA"])
const ALLOWED_YEARS = new Set([1, 2, 3])
const DEFAULT_SESSION_GEOFENCE_METERS = Number(process.env.DEFAULT_SESSION_GEOFENCE_METERS ?? "10")

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

  const body = (await req.json()) as {
    subject?: string
    department?: string
    year?: number
    durationSeconds?: number
    latitude?: number
    longitude?: number
    radiusMeters?: number
  }

  const subject = String(body.subject ?? "").trim()
  const department = String(body.department ?? actor.teacher.department).trim()
  const year = Number(body.year)
  const durationSeconds = Number(body.durationSeconds)
  const latitude = typeof body.latitude === "number" ? body.latitude : Number.NaN
  const longitude = typeof body.longitude === "number" ? body.longitude : Number.NaN
  const radiusMetersRaw =
    typeof body.radiusMeters === "number" ? body.radiusMeters : DEFAULT_SESSION_GEOFENCE_METERS
  const radiusMeters = Math.max(5, Math.min(150, Math.round(radiusMetersRaw)))

  if (!subject || !Number.isInteger(year) || !Number.isInteger(durationSeconds)) {
    return NextResponse.json(
      { error: "subject, year and durationSeconds are required" },
      { status: 400 }
    )
  }

  if (!ALLOWED_DEPARTMENTS.has(department)) {
    return NextResponse.json(
      { error: "department must be one of BCA or BBA" },
      { status: 400 }
    )
  }

  if (!ALLOWED_YEARS.has(year)) {
    return NextResponse.json(
      { error: "year must be 1, 2, or 3" },
      { status: 400 }
    )
  }

  const allowedSubjects = getSubjectsForDepartmentYear(department, year)
  if (!allowedSubjects.includes(subject)) {
    return NextResponse.json(
      { error: "subject must be selected from the configured department/year curriculum" },
      { status: 400 }
    )
  }

  if (durationSeconds < 30 || durationSeconds > 300) {
    return NextResponse.json(
      { error: "durationSeconds must be between 30 and 300" },
      { status: 400 }
    )
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      {
        error:
          "Teacher location is required to start a session. Please enable location and try again.",
      },
      { status: 400 }
    )
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return NextResponse.json({ error: "Invalid latitude/longitude provided" }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + durationSeconds * 1000)
  const session = await prisma.session.create({
    data: {
      subject,
      department,
      year,
      createdBy: actor.id,
      geofenceLatitude: latitude,
      geofenceLongitude: longitude,
      geofenceRadiusMeters: radiusMeters,
      expiresAt,
    },
    select: {
      id: true,
      subject: true,
      department: true,
      year: true,
      geofenceRadiusMeters: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  const baseUrl = new URL(req.url).origin
  const scanUrl = `${baseUrl}/scan?sessionId=${encodeURIComponent(session.id)}`

  const totalStudents = await prisma.student.count({
    where: {
      department,
      year,
      isActive: true,
    },
  })

  return NextResponse.json({
    session,
    scanUrl,
    totalStudents,
    geofenceRadiusMeters: session.geofenceRadiusMeters,
  })
}
