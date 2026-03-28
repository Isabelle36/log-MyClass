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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ attendanceId: string }> }
) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { attendanceId } = await context.params
  const payload = (await req.json()) as {
    status?: "PRESENT" | "ABSENT" | "EXCUSED"
  }

  if (!payload.status || !["PRESENT", "ABSENT", "EXCUSED"].includes(payload.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  // Parse potential synthetic ID: "sessionId:studentId"
  const parts = attendanceId.split(':')
  const isSynthetic = parts.length === 2
  const sessionId = isSynthetic ? parts[0] : attendanceId
  const studentId = isSynthetic ? parts[1] : undefined

  try {
    let updated

    if (isSynthetic) {
      // Synthetic ABSENT: create new record
      updated = await prisma.attendance.create({
        data: {
          sessionId,
          studentId,
          status: payload.status,
          // Synthetic admin-marked records don't have real location data.
          // Use neutral coordinates so required fields are satisfied.
          latitude: 0,
          longitude: 0,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          studentId: true,
          sessionId: true,
        },
      })
    } else {
      // Real record: update if ABSENT
      const result = await prisma.attendance.updateMany({
        where: {
          id: attendanceId,
          status: "ABSENT",
        },
        data: { status: payload.status },
      })

      if (result.count === 0) {
        return NextResponse.json(
          { error: "Only absent records can be updated" },
          { status: 409 }
        )
      }

      updated = await prisma.attendance.findUnique({
        where: { id: attendanceId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          studentId: true,
          sessionId: true,
        },
      })
    }

    return NextResponse.json({ attendance: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attendance"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
