import { prisma } from "@/lib/prisma"
import { clerkClient } from "@clerk/nextjs/server"
import type { Role, User } from "@/src/generated/prisma"

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

const SYNCABLE_ROLES: Role[] = ["ADMIN", "TEACHER", "STUDENT"]

function parseSyncRole(value: unknown): Role | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (SYNCABLE_ROLES.includes(normalized as Role)) {
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

function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }

  return null
}

function parseStudentFullName(value: unknown, firstName?: string | null, lastName?: string | null) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim()
  }

  const composed = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim()
  if (composed.length > 0) {
    return composed
  }

  return "Student"
}

function getPrimaryEmail(clerkUser: {
  primaryEmailAddressId?: string | null
  emailAddresses: Array<{ id: string; emailAddress: string }>
}): string | null {
  const primary =
    clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

  if (!primary || !primary.trim()) {
    return null
  }

  return primary.trim().toLowerCase()
}

export async function syncUserWithDatabase({
  clerkUserId,
  requiredRole,
  fallbackTeacherDepartment,
}: SyncOptions): Promise<SyncResult> {
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)
  const syncRole = parseSyncRole(clerkUser.publicMetadata?.role)
  const primaryEmail = getPrimaryEmail(clerkUser)

  if (!syncRole) {
    return { user: null, adminExists: true, reason: "missing_role_metadata" }
  }

  if (requiredRole && syncRole !== requiredRole) {
    return { user: null, adminExists: true, reason: "role_mismatch" }
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: {
      email: primaryEmail,
      role: syncRole,
    },
    create: {
      clerkUserId,
      email: primaryEmail,
      role: syncRole,
    },
  })

  if (syncRole === "TEACHER") {
    const department = parseDepartment(
      clerkUser.publicMetadata?.department,
      fallbackTeacherDepartment
    )

    await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {
        email: primaryEmail,
        department,
      },
      create: {
        userId: user.id,
        email: primaryEmail,
        department,
      },
    })
  }

  if (syncRole === "STUDENT") {
    await prisma.teacher.deleteMany({
      where: { userId: user.id },
    })

    const studentDepartment = parseDepartment(clerkUser.publicMetadata?.department)
    const studentYear = parseInteger(clerkUser.publicMetadata?.year)
    const studentRollNo = parseInteger(clerkUser.publicMetadata?.rollNo)
    const studentFullName = parseStudentFullName(
      clerkUser.publicMetadata?.fullName,
      clerkUser.firstName,
      clerkUser.lastName
    )

    if (studentYear && studentRollNo) {
      await prisma.student.upsert({
        where: { userId: user.id },
        update: {
          fullName: studentFullName,
          email: primaryEmail,
          department: studentDepartment,
          year: studentYear,
          rollNo: studentRollNo,
          academicYear: `${studentYear}`,
          isActive: true,
        },
        create: {
          userId: user.id,
          fullName: studentFullName,
          email: primaryEmail,
          department: studentDepartment,
          year: studentYear,
          rollNo: studentRollNo,
          academicYear: `${studentYear}`,
          isActive: true,
        },
      })
    }
  }

  return { user, adminExists: true }
}
