import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

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
    },
  })

  if (actor?.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await req.json()) as { sessionId?: string }
  const sessionId = String(body.sessionId ?? "").trim()

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
  }

  const updated = await prisma.session.updateMany({
    where: {
      id: sessionId,
      createdBy: actor.id,
    },
    data: {
      expiresAt: new Date(),
    },
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json({ ended: true })
}
