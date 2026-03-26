import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

const ALLOWED_DEPARTMENTS = new Set(["BBA", "BCA"])
const ALLOWED_YEARS = new Set([1, 2, 3])

async function getTeacherActor(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
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
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actor = await getTeacherActor(userId)
  if (actor?.role !== "TEACHER" || !actor.teacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json()) as {
    fullName?: string
    email?: string
    department?: string
    year?: number
    rollNo?: number
  }

  const fullName = String(body.fullName ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const requestedDepartment = String(body.department ?? actor.teacher.department)
    .trim()
    .toUpperCase()
  const year = Number(body.year)
  const rollNo = Number(body.rollNo)

  if (!ALLOWED_DEPARTMENTS.has(requestedDepartment)) {
    return NextResponse.json(
      { error: "department must be BBA or BCA" },
      { status: 400 }
    )
  }

  if (!ALLOWED_YEARS.has(year)) {
    return NextResponse.json(
      { error: "year must be 1, 2 or 3" },
      { status: 400 }
    )
  }

  const department = requestedDepartment

  if (!fullName || !email || !Number.isInteger(year) || !Number.isInteger(rollNo)) {
    return NextResponse.json(
      { error: "fullName, email, year and rollNo are required" },
      { status: 400 }
    )
  }

  const existingStudentWithRoll = await prisma.student.findUnique({
    where: {
      department_year_rollNo: {
        department,
        year,
        rollNo,
      },
    },
    select: {
      email: true,
      fullName: true,
    },
  })

  if (
    existingStudentWithRoll &&
    existingStudentWithRoll.email &&
    existingStudentWithRoll.email.toLowerCase() !== email
  ) {
    return NextResponse.json(
      {
        error:
          "This roll number already exists for another student in this class/year. Please use a different roll number.",
      },
      { status: 409 }
    )
  }

  const token = randomUUID()
  const baseUrl = new URL(req.url).origin
  const redirectUrl = `${baseUrl}/student/invite?token=${encodeURIComponent(token)}`

  await prisma.studentInvite.upsert({
    where: {
      department_year_rollNo: {
        department,
        year,
        rollNo,
      },
    },
    update: {
      fullName,
      email,
      token,
      isUsed: false,
    },
    create: {
      fullName,
      email,
      department,
      year,
      rollNo,
      token,
    },
  })

  const client = await clerkClient()
  await client.invitations.createInvitation({
    emailAddress: email,
    redirectUrl,
    ignoreExisting: true,
    publicMetadata: {
      role: "STUDENT",
      fullName,
      department,
      year,
      rollNo,
    },
  })

  return NextResponse.json({
    sent: true,
    role: "STUDENT",
    email,
    department,
  })
}
