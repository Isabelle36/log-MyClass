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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const teacherId = params.id

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
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

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const client = await clerkClient()

    try {
      await client.users.deleteUser(teacher.user.clerkUserId)
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ""
      const shouldIgnore = message.includes("not found") || message.includes("404")

      if (!shouldIgnore) {
        return NextResponse.json(
          { error: "Failed to delete teacher auth account in Clerk" },
          { status: 502 }
        )
      }
    }

    await prisma.$transaction([
      prisma.teacher.delete({ where: { id: teacher.id } }),
      prisma.user.delete({ where: { id: teacher.user.id } }),
    ])

    return NextResponse.json({ message: "Teacher deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete teacher" },
      { status: 500 }
    )
  }
}
