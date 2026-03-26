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

function getNamePartsCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function pickFullerDisplayName(dbName: string | null, clerkName: string | undefined) {
  const normalizedDb = typeof dbName === "string" ? dbName.trim() : ""
  const normalizedClerk = typeof clerkName === "string" ? clerkName.trim() : ""

  if (!normalizedDb && !normalizedClerk) {
    return ""
  }
  if (!normalizedDb) {
    return normalizedClerk
  }
  if (!normalizedClerk) {
    return normalizedDb
  }

  return getNamePartsCount(normalizedDb) >= getNamePartsCount(normalizedClerk)
    ? normalizedDb
    : normalizedClerk
}

export async function GET(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!(await isAdmin(userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? ""
  const department = url.searchParams.get("department")?.trim() ?? ""

  const teachers = await prisma.teacher.findMany({
    where: {
      ...(department ? { department: { equals: department, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { user: { email: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      department: true,
      userId: true,
      user: {
        select: {
          clerkUserId: true,
          email: true,
        },
      },
    },
    orderBy: [{ department: "asc" }, { fullName: "asc" }],
    take: 500,
  })

  const getClerkDisplayName = (clerkUser: any) => {
    const metadata = clerkUser?.publicMetadata as Record<string, unknown> | undefined
    const fullNameFromMetadata = metadata?.fullName || metadata?.full_name || metadata?.name
    
    if (typeof fullNameFromMetadata === "string" && fullNameFromMetadata.trim()) {
      return fullNameFromMetadata.trim()
    }

    const composed = [clerkUser?.firstName?.trim(), clerkUser?.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim()

    return composed || null
  }

  const client = await clerkClient()
  const clerkUserIds = Array.from(new Set(teachers.map((teacher) => teacher.user.clerkUserId).filter(Boolean)))

  const clerkNameById = new Map<string, string>()
  await Promise.all(
    clerkUserIds.map(async (clerkUserId) => {
      try {
        const clerkUser = await client.users.getUser(clerkUserId)
        const displayName = getClerkDisplayName(clerkUser)
        if (displayName) {
          clerkNameById.set(clerkUserId, displayName)
        }
      } catch {
        // Keep DB value if Clerk lookup fails.
      }
    })
  )

  const teachersWithDisplayName = teachers.map((teacher) => ({
    ...teacher,
    fullName: pickFullerDisplayName(
      teacher.fullName,
      clerkNameById.get(teacher.user.clerkUserId)
    ),
  }))

  return NextResponse.json({
    count: teachersWithDisplayName.length,
    teachers: teachersWithDisplayName,
  })
}
