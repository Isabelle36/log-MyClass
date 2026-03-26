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

const RETRYABLE_PRISMA_ERROR_CODES = new Set(["P1001", "P1002"])

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryablePrismaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : undefined
  const message =
    "message" in error && typeof error.message === "string" ? error.message : ""

  if (code && RETRYABLE_PRISMA_ERROR_CODES.has(code)) {
    return true
  }

  return (
    message.includes("Can't reach database server") ||
    message.includes("PrismaClientInitializationError") ||
    message.includes("Timed out fetching a new connection")
  )
}

async function withPrismaRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!isRetryablePrismaError(error) || attempt === maxAttempts) {
        throw error
      }

      const backoffMs = attempt * 400
      await sleep(backoffMs)
    }
  }

  throw lastError
}

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

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function isValidTeacherName(value: string) {
  return /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value)
}

function parseTeacherFullName(value: unknown, firstName?: string | null, lastName?: string | null, email?: string | null) {
  if (typeof value === "string" && value.trim().length > 0) {
    const normalized = normalizeName(value)
    if (normalized.length >= 2 && normalized.length <= 80 && isValidTeacherName(normalized)) {
      return normalized
    }
  }

  const composed = normalizeName([firstName?.trim(), lastName?.trim()].filter(Boolean).join(" "))
  if (composed.length >= 2 && composed.length <= 80 && isValidTeacherName(composed)) {
    return composed
  }

  if (email && email.trim().length > 0) {
    const localPart = email
      .trim()
      .split("@")[0]
      ?.replace(/[0-9._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    if (localPart) {
      const normalized = normalizeName(localPart)
      if (normalized.length >= 2 && normalized.length <= 80 && isValidTeacherName(normalized)) {
        return normalized
      }
    }
  }

  return "Teacher"
}

function getNamePartsCount(value: string) {
  return normalizeName(value).split(" ").filter(Boolean).length
}

function choosePreferredTeacherName(existingName: string | null, incomingName: string) {
  if (!existingName || !existingName.trim()) {
    return incomingName
  }

  const normalizedExisting = normalizeName(existingName)
  if (!isValidTeacherName(normalizedExisting)) {
    return incomingName
  }

  const existingParts = getNamePartsCount(normalizedExisting)
  const incomingParts = getNamePartsCount(incomingName)

  // Keep the fuller historical value if incoming sync data is shorter.
  if (existingParts > incomingParts) {
    return normalizedExisting
  }

  return incomingName
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

  const user = await withPrismaRetry(() =>
    prisma.user.upsert({
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
  )

  if (syncRole === "TEACHER") {
    const department = parseDepartment(
      clerkUser.publicMetadata?.department,
      fallbackTeacherDepartment
    )
    const existingTeacher = await withPrismaRetry(() =>
      prisma.teacher.findUnique({
        where: { userId: user.id },
        select: { fullName: true },
      })
    )

    const teacherNameFromMetadata =
      (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.fullName ??
      (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.full_name ??
      (clerkUser.publicMetadata as Record<string, unknown> | undefined)?.name

    const parsedTeacherFullName = parseTeacherFullName(
      teacherNameFromMetadata,
      clerkUser.firstName,
      clerkUser.lastName,
      primaryEmail
    )
    const teacherFullName = choosePreferredTeacherName(
      existingTeacher?.fullName ?? null,
      parsedTeacherFullName
    )

    await withPrismaRetry(() =>
      prisma.teacher.upsert({
        where: { userId: user.id },
        update: {
          fullName: teacherFullName,
          email: primaryEmail,
          department,
        },
        create: {
          userId: user.id,
          fullName: teacherFullName,
          email: primaryEmail,
          department,
        },
      })
    )
  }

  if (syncRole === "STUDENT") {
    await withPrismaRetry(() =>
      prisma.teacher.deleteMany({
        where: { userId: user.id },
      })
    )

    const studentDepartment = parseDepartment(clerkUser.publicMetadata?.department)
    const studentYear = parseInteger(clerkUser.publicMetadata?.year)
    const studentRollNo = parseInteger(clerkUser.publicMetadata?.rollNo)
    const studentFullName = parseStudentFullName(
      clerkUser.publicMetadata?.fullName,
      clerkUser.firstName,
      clerkUser.lastName
    )

    if (studentYear && studentRollNo) {
      await withPrismaRetry(() =>
        prisma.student.upsert({
          where: { userId: user.id },
          update: {
            fullName: studentFullName,
            email: primaryEmail,
            department: studentDepartment,
            year: studentYear,
            rollNo: studentRollNo,
            academicYear: `${studentYear}`,
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
      )
    }
  }

  return { user, adminExists: true }
}
