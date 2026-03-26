import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const attendanceModel = prisma.attendance as any
const userModel = prisma.user as any

function getNamePartsCount(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function pickFullerDisplayName(dbName: string | null | undefined, clerkName: string | undefined) {
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

async function isAdmin(clerkUserId: string) {
  const actor = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  })

  return actor?.role === "ADMIN"
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
  const studentId = url.searchParams.get("studentId")?.trim() ?? ""
  const department = url.searchParams.get("department")?.trim() ?? ""
  const yearRaw = url.searchParams.get("year")?.trim() ?? ""

  const year = Number(yearRaw)

  const logs = await attendanceModel.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(department || yearRaw
        ? {
            student: {
              ...(department ? { department: { equals: department, mode: "insensitive" } } : {}),
              ...(yearRaw && Number.isInteger(year) ? { year } : {}),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      status: true,
      createdAt: true,
      latitude: true,
      longitude: true,
      ipAddress: true,
      userAgent: true,
      student: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          year: true,
          rollNo: true,
        },
      },
      session: {
        select: {
          id: true,
          subject: true,
          department: true,
          year: true,
          createdBy: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  })

  const typedLogs = logs as Array<{
    id: string
    status: "PRESENT" | "ABSENT"
    createdAt: Date
    session: {
      id: string
      subject: string
      department: string
      year: number
      createdBy: string
      createdAt: Date
      expiresAt: Date
    }
    student: {
      id: string
      fullName: string
      email: string | null
      department: string
      year: number
      rollNo: number
    }
  }>

  const creatorIds = Array.from(new Set(typedLogs.map((log) => log.session.createdBy))) as string[]
  const creators =
    creatorIds.length > 0
      ? await userModel.findMany({
          where: { id: { in: creatorIds } },
          select: {
            id: true,
            clerkUserId: true,
            email: true,
            teacher: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        })
      : []

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
  const creatorClerkIds = Array.from(
    new Set(
      (creators as Array<any>)
        .map((creator) => creator.clerkUserId)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  )

  const clerkNameById = new Map<string, string>()
  await Promise.all(
    creatorClerkIds.map(async (clerkUserId) => {
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

  const creatorById = new Map<string, any>(creators.map((creator: any) => [creator.id, creator]))

  const enrichedLogs = typedLogs.map((log) => {
    const creator = creatorById.get(log.session.createdBy) as any
    const clerkDisplayName =
      typeof creator?.clerkUserId === "string" ? clerkNameById.get(creator.clerkUserId) : undefined
    const fullerName = pickFullerDisplayName(creator?.teacher?.fullName, clerkDisplayName)
    const teacherName = fullerName || creator?.teacher?.email || creator?.email || "Unknown"

    return {
      ...log,
      session: {
        ...log.session,
        teacherName,
      },
    }
  })

  return NextResponse.json({ count: enrichedLogs.length, logs: enrichedLogs })
}
