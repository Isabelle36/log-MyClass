import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

const ALLOWED_DEPARTMENTS = new Set(["BBA", "BCA"])
const ALLOWED_YEARS = new Set([1, 2, 3])

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : null
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
    atRiskStudents?: Array<{
      id: string
      fullName: string
      email: string | null
      rollNo: number
      attendancePercentage: number
    }>
  }

  const department = String(payload.department ?? actor.teacher.department)
    .trim()
    .toUpperCase()
  const year = Number(payload.year)
  const atRiskStudents = payload.atRiskStudents ?? []

  // Validate department and year
  if (!ALLOWED_DEPARTMENTS.has(department)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 })
  }

  if (!ALLOWED_YEARS.has(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 })
  }

  // Verify actor teaches in this department
  if (actor.teacher.department !== department) {
    return NextResponse.json({ error: "Can only operate on your own department" }, { status: 403 })
  }

  try {
    const smtpHost = requiredEnv("SMTP_HOST")
    const smtpPort = Number(requiredEnv("SMTP_PORT") ?? "587")
    const smtpUser = requiredEnv("SMTP_USER")
    const smtpPass = requiredEnv("SMTP_PASS")
    const smtpFrom = requiredEnv("SMTP_FROM")

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in environment variables.",
        },
        { status: 500 }
      )
    }

    const validStudents = atRiskStudents.filter((student) => student.email && student.email.trim().length > 0)

    if (validStudents.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, error: "No valid email addresses" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const subject = `${department} Year ${year}: Attendance Warning (Below 75%)`

    const results = await Promise.allSettled(
      validStudents.map((student) =>
        transporter.sendMail({
          from: smtpFrom,
          to: student.email as string,
          subject,
          text: [
            `Dear ${student.fullName},`,
            "",
            `Your attendance is currently ${student.attendancePercentage}% and is below the required 75%.`,
            "Please attend upcoming classes regularly to improve your attendance record.",
            "",
            "Regards,",
            "Class Teacher",
          ].join("\n"),
        })
      )
    )

    const sent = results.filter((item) => item.status === "fulfilled").length
    const failed = atRiskStudents.length - sent

    return NextResponse.json({
      sent,
      failed,
      message: `Successfully sent ${sent} warning email${sent !== 1 ? "s" : ""}.`,
    })
  } catch (error) {
    console.error("Error sending attendance warnings:", error)
    return NextResponse.json(
      { error: "Failed to send emails", sent: 0, failed: atRiskStudents.length },
      { status: 500 }
    )
  }
}
