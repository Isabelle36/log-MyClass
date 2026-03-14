import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { syncUserWithDatabase } from "@/lib/auth/sync-user"

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (existingUser) {
    return NextResponse.json(existingUser)
  }

  const syncResult = await syncUserWithDatabase({ clerkUserId: userId })

  if (!syncResult.user) {
    return NextResponse.json(
      { error: "This account is not invited for this institution." },
      { status: 403 }
    )
  }

  return NextResponse.json(syncResult.user)
}