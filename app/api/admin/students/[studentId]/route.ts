import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { studentId } = await context.params
  const payload = (await req.json()) as {
    fullName?: string
    department?: string
    year?: number
    rollNo?: number
    isActive?: boolean
    academicYear?: string
  }

  try {
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(typeof payload.fullName === "string" ? { fullName: payload.fullName.trim() } : {}),
        ...(typeof payload.department === "string"
          ? { department: payload.department.trim().toUpperCase() }
          : {}),
        ...(Number.isInteger(payload.year) ? { year: Number(payload.year) } : {}),
        ...(Number.isInteger(payload.rollNo) ? { rollNo: Number(payload.rollNo) } : {}),
        ...(typeof payload.isActive === "boolean" ? { isActive: payload.isActive } : {}),
        ...(typeof payload.academicYear === "string"
          ? { academicYear: payload.academicYear.trim() }
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
      },
    })

    return NextResponse.json({ student: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update student"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { studentId } = await context.params

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            clerkUserId: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    const client = await clerkClient()

    try {
      await client.users.deleteUser(student.user.clerkUserId)
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ""
      const shouldIgnore = message.includes("not found") || message.includes("404")

      if (!shouldIgnore) {
        return NextResponse.json(
          { error: "Failed to delete student auth account in Clerk" },
          { status: 502 }
        )
      }
    }

    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { studentId: student.id } }),
      prisma.student.delete({ where: { id: student.id } }),
      prisma.user.delete({ where: { id: student.user.id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete student"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
