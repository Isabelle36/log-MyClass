import { PrismaClient } from "@/src/generated/prisma"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function hasStudentInviteEmailField(client: PrismaClient | undefined) {
  try {
    const fields = (client as unknown as {
      _runtimeDataModel?: {
        models?: {
          StudentInvite?: {
            fields?: Array<{ name?: string }>
          }
        }
      }
    })?._runtimeDataModel?.models?.StudentInvite?.fields

    if (!fields) {
      return false
    }

    return fields.some((field) => field.name === "email")
  } catch {
    return false
  }
}

const shouldRefreshDevClient =
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prisma &&
  !hasStudentInviteEmailField(globalForPrisma.prisma)

if (shouldRefreshDevClient) {
  globalForPrisma.prisma = new PrismaClient()
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma
