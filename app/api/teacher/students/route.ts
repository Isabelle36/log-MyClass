import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const ALLOWED_DEPARTMENTS = new Set(["BBA", "BCA"])

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const actor = await prisma.user.findUnique({
    where: { clerkUserId: userId },
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const yearRaw = url.searchParams.get("year")?.trim() ?? ""
  const requestedDepartmentRaw = url.searchParams.get("department")?.trim() ?? ""
  const year = Number(yearRaw)

  const requestedDepartment = requestedDepartmentRaw.toUpperCase()
  const hasDepartmentParam = requestedDepartmentRaw.length > 0
  const departmentFilter =
    requestedDepartment === "ALL"
      ? undefined
      : hasDepartmentParam
        ? requestedDepartment
        : actor.teacher.department

  if (departmentFilter && !ALLOWED_DEPARTMENTS.has(departmentFilter)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 })
  }

  const students = await prisma.student.findMany({
    where: {
      ...(departmentFilter ? { department: departmentFilter } : {}),
      ...(yearRaw && Number.isInteger(year) ? { year } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              ...(Number.isInteger(Number(q)) ? [{ rollNo: Number(q) }] : []),
            ],
          }
        : {}),
    },
    orderBy: [{ year: "asc" }, { rollNo: "asc" }],
    take: 300,
    select: {
      id: true,
      fullName: true,
      email: true,
      year: true,
      rollNo: true,
      isActive: true,
      department: true,
      academicYear: true,
    },
  })

  return NextResponse.json({
    count: students.length,
    department: departmentFilter,
    students,
  })
}
