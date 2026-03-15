import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true },
    })

    if (actor?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await req.json()) as {
      fullName?: string
      email?: string
      department?: string
      year?: number
      rollNo?: number
    }

    const fullName = String(body.fullName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const department = String(body.department ?? "").trim()
    const year = Number(body.year)
    const rollNo = Number(body.rollNo)

    if (!fullName || !email || !department || !Number.isInteger(year) || !Number.isInteger(rollNo)) {
      return NextResponse.json(
        { error: "fullName, email, department, year and rollNo are required" },
        { status: 400 }
      )
    }

    const token = randomUUID()
    const baseUrl = new URL(req.url).origin
    const redirectUrl = `${baseUrl}/student/invite?token=${encodeURIComponent(token)}`

    try {
      await prisma.studentInvite.upsert({
        where: {
          department_year_rollNo: {
            department,
            year,
            rollNo,
          },
        },
        update: {
          fullName,
          email,
          token,
          isUsed: false,
        },
        create: {
          fullName,
          email,
          department,
          year,
          rollNo,
          token,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown database error"
      return NextResponse.json(
        { error: `Failed to save student invite: ${message}` },
        { status: 500 }
      )
    }

    const client = await clerkClient()
    try {
      await client.invitations.createInvitation({
        emailAddress: email,
        redirectUrl,
        ignoreExisting: true,
        publicMetadata: {
          role: "STUDENT",
          fullName,
          department,
          year,
          rollNo,
        },
      })
    } catch (err: unknown) {
      const errorPayload =
        typeof err === "object" && err !== null && "errors" in err
          ? (err as { errors?: Array<{ message?: string }> }).errors
          : undefined
      const message =
        errorPayload?.[0]?.message ??
        (err instanceof Error ? err.message : "Unknown error")
      return NextResponse.json(
        { error: `Failed to send invite email: ${message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sent: true,
      role: "STUDENT",
      email,
    })
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating student invite" },
      { status: 500 }
    )
  }
}