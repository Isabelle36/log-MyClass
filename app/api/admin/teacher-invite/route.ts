import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { email, department } = await req.json()

  if (!email || !department) {
    return NextResponse.json({ error: "Email and department are required" }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedDepartment = String(department).trim()

  if (!normalizedEmail || !normalizedDepartment) {
    return NextResponse.json({ error: "Email and department are required" }, { status: 400 })
  }

  const token = randomUUID()

  // Derive base URL from the request so this works in both dev and prod
  const baseUrl = new URL(req.url).origin
  const redirectUrl = `${baseUrl}/teacher/invite?token=${token}`

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
        department: normalizedDepartment,
      },
    })
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? err?.message ?? "Unknown error"
    return NextResponse.json(
      { error: `Failed to send invite email: ${message}` },
      { status: 500 }
    )
  }

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

  return NextResponse.json({ sent: true, email: normalizedEmail })
}