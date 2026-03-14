import { auth } from "@clerk/nextjs/server"
import type { Role, User } from "@/src/generated/prisma"
import { redirect } from "next/navigation"
import { syncUserWithDatabase } from "@/lib/auth/sync-user"

export type AppRole = Extract<Role, "ADMIN" | "TEACHER" | "STUDENT">

export async function getCurrentPrismaUser(): Promise<User | null> {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const syncResult = await syncUserWithDatabase({
    clerkUserId: userId,
  })

  return syncResult.user
}

export async function requireRole(role: AppRole): Promise<User> {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const syncResult = await syncUserWithDatabase({
    clerkUserId: userId,
    requiredRole: role,
  })

  if (!syncResult.user) {
    if (syncResult.reason === "role_mismatch") {
      redirect("/dashboard")
    }

    redirect("/no-access")
  }

  return syncResult.user
}