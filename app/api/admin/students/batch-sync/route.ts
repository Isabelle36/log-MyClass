import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

function normalizeDepartment(value: string) {
  return value.trim().toUpperCase()
}

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
}

async function runPromoteMode({
  department,
  sourceYear,
  targetYear,
  academicYear,
}: {
  department: string
  sourceYear: number
  targetYear: number
  academicYear: string
}) {
  const students = await prisma.student.findMany({
    where: {
      department,
      year: sourceYear,
      isActive: true,
    },
    select: {
      id: true,
      rollNo: true,
    },
  })

  let promoted = 0
  let failed = 0

  for (const student of students) {
    const conflict = await prisma.student.findFirst({
      where: {
        department,
        year: targetYear,
        rollNo: student.rollNo,
        NOT: { id: student.id },
      },
      select: { id: true },
    })

    if (conflict) {
      failed += 1
      continue
    }

    await prisma.student.update({
      where: { id: student.id },
      data: {
        year: targetYear,
        academicYear,
        isActive: true,
      },
    })

    promoted += 1
  }

  return {
    mode: "promote",
    department,
    sourceYear,
    targetYear,
    total: students.length,
    promoted,
    failed,
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const mode = String(formData.get("mode") ?? "").trim().toLowerCase()
  const departmentRaw = String(formData.get("department") ?? "").trim()
  const sourceYear = Number(formData.get("sourceYear"))
  const targetYear = Number(formData.get("targetYear"))
  const academicYearRaw = String(formData.get("academicYear") ?? "").trim()

  if (mode !== "promote") {
    return NextResponse.json({ error: "Only promote mode is supported" }, { status: 400 })
  }

  if (!departmentRaw || !Number.isInteger(sourceYear) || !Number.isInteger(targetYear)) {
    return NextResponse.json(
      { error: "department, sourceYear and targetYear are required" },
      { status: 400 }
    )
  }

  const department = normalizeDepartment(departmentRaw)
  const academicYear = academicYearRaw || `${targetYear}`

  const result = await runPromoteMode({
    department,
    sourceYear,
    targetYear,
    academicYear,
  })

  return NextResponse.json(result)
}
