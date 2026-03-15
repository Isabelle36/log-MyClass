import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

export default async function StudentInvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[]
    __clerk_ticket?: string | string[]
    __clerk_status?: string | string[]
  }>
}) {
  const params = await searchParams
  const tokenParam = params.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam
  const clerkTicketParam = params.__clerk_ticket
  const clerkTicket = Array.isArray(clerkTicketParam)
    ? clerkTicketParam[0]
    : clerkTicketParam
  const clerkStatusParam = params.__clerk_status
  const clerkStatus = Array.isArray(clerkStatusParam)
    ? clerkStatusParam[0]
    : clerkStatusParam

  if (!token) {
    notFound()
  }

  const invite = await prisma.studentInvite.findUnique({
    where: { token },
  })

  if (!invite || invite.isUsed) {
    notFound()
  }

  const { userId } = await auth()

  if (!userId) {
    const redirectParams = new URLSearchParams({
      invite_token: token,
      invite_type: "student",
    })

    if (clerkTicket) {
      redirectParams.set("__clerk_ticket", clerkTicket)
    }
    if (clerkStatus) {
      redirectParams.set("__clerk_status", clerkStatus)
    }

    redirect(`/sign-up?${redirectParams.toString()}`)
  }

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

  if (!primaryEmail) {
    redirect("/no-access")
  }

  if (!invite.email) {
    await prisma.studentInvite.update({
      where: { id: invite.id },
      data: { email: primaryEmail.trim().toLowerCase() },
    })
  }

  const invitedEmail = (invite.email ?? primaryEmail).trim().toLowerCase()
  const signedInEmail = primaryEmail.trim().toLowerCase()

  if (invitedEmail !== signedInEmail) {
    redirect("/no-access")
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: "STUDENT",
      fullName: invite.fullName,
    },
  })

  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {
      email: signedInEmail,
      role: "STUDENT",
    },
    create: {
      clerkUserId: userId,
      email: signedInEmail,
      role: "STUDENT",
    },
  })

  await prisma.student.upsert({
    where: { userId: user.id },
    update: {
      fullName: invite.fullName,
      email: signedInEmail,
      department: invite.department,
      year: invite.year,
      rollNo: invite.rollNo,
      academicYear: `${invite.year}`,
      isActive: true,
    },
    create: {
      userId: user.id,
      fullName: invite.fullName,
      email: signedInEmail,
      department: invite.department,
      year: invite.year,
      rollNo: invite.rollNo,
      academicYear: `${invite.year}`,
      isActive: true,
    },
  })

  await prisma.studentInvite.updateMany({
    where: { id: invite.id, isUsed: false },
    data: { isUsed: true },
  })

  redirect("/student")
}