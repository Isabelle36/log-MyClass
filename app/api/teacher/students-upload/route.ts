import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

type CsvRow = {
  fullName: string
  email: string
  year: number
  rollNo: number
}

const SUPPORTED_EXTENSIONS = new Set(["csv", "xlsx", "xls"])

function parseYear(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  const text = String(value ?? "").trim().toLowerCase()
  const match = text.match(/\d+/)
  if (!match) {
    return Number.NaN
  }

  return Number(match[0])
}

function parseRollNo(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  const text = String(value ?? "").trim()
  return Number(text)
}

function parseSpreadsheet(buffer: ArrayBuffer): CsvRow[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined

  if (!firstSheet) {
    return []
  }

  const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
  })

  const findCellValue = (row: Record<string, unknown>, possibleKeys: string[]) => {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
      if (possibleKeys.includes(normalizedKey)) {
        return row[key]
      }
    }
    return undefined
  }

  const rows: CsvRow[] = []
  for (const row of sheetRows) {
    const fullNameRaw = findCellValue(row, ["fullname", "full_name", "name"])
    const emailRaw = findCellValue(row, ["email", "emailaddress"])
    const yearRaw = findCellValue(row, ["year"])
    const rollNoRaw = findCellValue(row, ["rollno", "roll_number", "rollnumber"])

    const fullName = String(fullNameRaw ?? "").trim()
    const email = String(emailRaw ?? "").trim().toLowerCase()
    const year = parseYear(yearRaw)
    const rollNo = parseRollNo(rollNoRaw)

    if (!fullName || !email || !Number.isInteger(year) || !Number.isInteger(rollNo)) {
      continue
    }

    rows.push({ fullName, email, year, rollNo })
  }

  return rows
}

async function getTeacherDepartment(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      role: true,
      teacher: {
        select: {
          department: true,
        },
      },
    },
  })

  if (actor?.role !== "TEACHER" || !actor.teacher) {
    return null
  }

  return actor.teacher.department
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const department = await getTeacherDepartment(userId)
  if (!department) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 })
  }

  const extension = file.name.toLowerCase().split(".").pop() ?? ""
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Only .csv, .xlsx, and .xls files are allowed" },
      { status: 400 }
    )
  }

  const buffer = await file.arrayBuffer()
  const rows = parseSpreadsheet(buffer)

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid rows found. Expected columns in CSV/XLSX/XLS: Full name, Email, Department, Year, Roll no.",
      },
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
          department,
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
          department,
          year: row.year,
          rollNo: row.rollNo,
        },
      },
      select: { id: true },
    })

    await prisma.studentInvite.upsert({
      where: {
        department_year_rollNo: {
          department,
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
        department,
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
    department,
  })
}
