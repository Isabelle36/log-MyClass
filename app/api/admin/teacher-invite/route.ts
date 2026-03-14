import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
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

  const { fullName, email, department } = await req.json()

  if (!fullName || !email || !department) {
    return NextResponse.json({ error: "Full name, email and department are required" }, { status: 400 })
  }

  const normalizedFullName = String(fullName).trim()
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedDepartment = String(department).trim()

  if (!normalizedFullName || !normalizedEmail || !normalizedDepartment) {
    return NextResponse.json({ error: "Full name, email and department are required" }, { status: 400 })
  }

  const token = randomUUID()

  // Derive base URL from the request so this works in both dev and prod
  const baseUrl = new URL(req.url).origin
  const redirectUrl = `${baseUrl}/teacher/invite?token=${token}`

  try {
    await prisma.teacherInvite.upsert({
      where: { email: normalizedEmail },
      update: {
        department: normalizedDepartment,
        token,
        isUsed: false,
      },
      create: {
        email: normalizedEmail,
        department: normalizedDepartment,
        token,
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown database error"
    return NextResponse.json(
      { error: `Failed to save teacher invite: ${message}` },
      { status: 500 }
    )
  }

  // Create Clerk invitation — this emails the teacher AND allows them to
  // sign up despite restricted mode being enabled on the Clerk account.
  const client = await clerkClient()
  try {
    await client.invitations.createInvitation({
      emailAddress: normalizedEmail,
      redirectUrl,
      ignoreExisting: true,
      publicMetadata: {
        role: "TEACHER",
        fullName: normalizedFullName,
        department: normalizedDepartment,
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

  return NextResponse.json({ sent: true, email: normalizedEmail, fullName: normalizedFullName })
}