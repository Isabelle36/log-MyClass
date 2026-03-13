import { prisma } from "@/lib/prisma"
import AuthHeaderClient from "./AuthHeaderClient"

export default async function AuthHeader() {
  let adminExists = null
  try {
    adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    })
  } catch {
    // Keep header rendering even when DB is temporarily unreachable.
    adminExists = null
  }

  return <AuthHeaderClient adminExists={Boolean(adminExists)} />
}

