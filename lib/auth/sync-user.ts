import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"
import type { Role, User } from "@prisma/client"

type SyncOptions = {
  clerkUserId: string
  requiredRole?: Role
  fallbackTeacherDepartment?: string
}

type SyncResult = {
  user: User | null
  adminExists: boolean
  reason?: "missing_role_metadata" | "role_mismatch"
}

const INVITE_ROLES: Role[] = ["TEACHER", "STUDENT"]

function parseInviteRole(value: unknown): Role | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (INVITE_ROLES.includes(normalized as Role)) {
    return normalized as Role
  }

  return null
}

function parseDepartment(value: unknown, fallback?: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim()
  }

  if (fallback && fallback.trim().length > 0) {
    return fallback.trim()
  }

  return "GENERAL"
}

export async function syncUserWithDatabase({
  clerkUserId,
  requiredRole,
  fallbackTeacherDepartment,
}: SyncOptions): Promise<SyncResult> {
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId },
  })

  if (existingUser) {
    if (requiredRole && existingUser.role !== requiredRole) {
      return { user: null, adminExists: true, reason: "role_mismatch" }
    }

    if (existingUser.role === "TEACHER" && fallbackTeacherDepartment?.trim()) {
      await prisma.teacher.upsert({
        where: { userId: existingUser.id },
        update: {
          department: parseDepartment(undefined, fallbackTeacherDepartment),
        },
        create: {
          userId: existingUser.id,
          department: parseDepartment(undefined, fallbackTeacherDepartment),
        },
      })
    }

    return { user: existingUser, adminExists: true }
  }

  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  if (!adminExists) {
    return { user: null, adminExists: false }
  }

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)
  const inviteRole = parseInviteRole(clerkUser.publicMetadata?.role)

  if (!inviteRole) {
    return { user: null, adminExists: true, reason: "missing_role_metadata" }
  }

  if (requiredRole && inviteRole !== requiredRole) {
    return { user: null, adminExists: true, reason: "role_mismatch" }
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: {
      role: inviteRole,
    },
    create: {
      clerkUserId,
      role: inviteRole,
    },
  })

  if (inviteRole === "TEACHER") {
    const department = parseDepartment(
      clerkUser.publicMetadata?.department,
      fallbackTeacherDepartment
    )

    await prisma.teacher.upsert({
      where: { userId: user.id },
      update: { department },
      create: {
        userId: user.id,
        department,
      },
    })
  }

  return { user, adminExists: true }
}
