import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

type CsvRow = {
  fullName: string
  email: string
  department: string
  year: number
  rollNo: number
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return []
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase())
  const fullNameIndex = headers.indexOf("fullname")
  const emailIndex = headers.indexOf("email")
  const departmentIndex = headers.indexOf("department")
  const yearIndex = headers.indexOf("year")
  const rollNoIndex = headers.indexOf("rollno")

  if ([fullNameIndex, emailIndex, departmentIndex, yearIndex, rollNoIndex].includes(-1)) {
    return []
  }

  const rows: CsvRow[] = []

  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((col) => col.trim())
    const fullName = cols[fullNameIndex]
    const email = cols[emailIndex]?.toLowerCase()
    const department = cols[departmentIndex]
    const year = Number(cols[yearIndex])
    const rollNo = Number(cols[rollNoIndex])

    if (!fullName || !email || !department || !Number.isInteger(year) || !Number.isInteger(rollNo)) {
      continue
    }

    rows.push({
      fullName,
      email,
      department,
      year,
      rollNo,
    })
  }

  return rows
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actor = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true },
  })

  if (actor?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCsv(text)

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid rows found. Expected fullName, email, department, year, rollNo columns." },
      { status: 400 }
    )
  }

  const client = await clerkClient()
  const baseUrl = new URL(req.url).origin

  let created = 0
  let updated = 0
  let failed = 0

  for (const row of rows) {
    const token = randomUUID()
    const redirectUrl = `${baseUrl}/student/invite?token=${encodeURIComponent(token)}`

    try {
      await client.invitations.createInvitation({
        emailAddress: row.email,
        redirectUrl,
        ignoreExisting: true,
        publicMetadata: {
          role: "STUDENT",
          fullName: row.fullName,
          department: row.department,
          year: row.year,
          rollNo: row.rollNo,
        },
      })
    } catch {
      failed += 1
      continue
    }

    const existing = await prisma.studentInvite.findUnique({
      where: {
        department_year_rollNo: {
          department: row.department,
          year: row.year,
          rollNo: row.rollNo,
        },
      },
      select: { id: true },
    })

    await prisma.studentInvite.upsert({
      where: {
        department_year_rollNo: {
          department: row.department,
          year: row.year,
          rollNo: row.rollNo,
        },
      },
      update: {
        fullName: row.fullName,
        email: row.email,
        token,
        isUsed: false,
      },
      create: {
        fullName: row.fullName,
        email: row.email,
        department: row.department,
        year: row.year,
        rollNo: row.rollNo,
        token,
      },
    })

    if (existing) {
      updated += 1
    } else {
      created += 1
    }
  }

  return NextResponse.json({
    total: rows.length,
    created,
    updated,
    failed,
    role: "STUDENT",
  })
}