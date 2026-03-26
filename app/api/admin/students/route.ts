import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const department = url.searchParams.get("department")?.trim() ?? ""
  const yearRaw = url.searchParams.get("year")?.trim() ?? ""
  const isActiveRaw = url.searchParams.get("isActive")?.trim().toLowerCase() ?? ""

  const year = Number(yearRaw)
  const isActive =
    isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : undefined

  const students = await prisma.student.findMany({
    where: {
      ...(department ? { department: { equals: department, mode: "insensitive" } } : {}),
      ...(yearRaw && Number.isInteger(year) ? { year } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
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
    select: {
      id: true,
      fullName: true,
      email: true,
      department: true,
      year: true,
      rollNo: true,
      isActive: true,
      academicYear: true,
      user: {
        select: {
          clerkUserId: true,
        },
      },
    },
    orderBy: [{ department: "asc" }, { year: "asc" }, { rollNo: "asc" }],
    take: 500,
  })

  return NextResponse.json({
    count: students.length,
    students,
  })
}
