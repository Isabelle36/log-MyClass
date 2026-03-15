import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { syncUserWithDatabase } from "@/lib/auth/sync-user"

export default async function TeacherInvitePage({
  searchParams
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

  const { userId } = await auth()

  if (!token) {
    notFound()
  }

  let invite: { id: string; email: string; department: string; token: string; isUsed: boolean; createdAt: Date } | null = null
  try {
    invite = await prisma.teacherInvite.findUnique({
      where: { token }
    })
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Database temporarily unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please try this invitation link again in a minute.
          </p>
        </div>
      </div>
    )
  }

  if (!invite) {
    notFound()
  }

  if (!userId) {
    const redirectParams = new URLSearchParams({
      invite_token: token,
      email: invite.email,
    })

    // Preserve Clerk invitation state so SignUp can continue ticket flow.
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

  const invitedEmail = invite.email.trim().toLowerCase()
  const signedInEmail = primaryEmail.trim().toLowerCase()

  if (invitedEmail !== signedInEmail) {
    redirect("/no-access")
  }

  if (invite.isUsed) {
    redirect("/teacher")
  }

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: "TEACHER",
      department: invite.department,
    },
  })

  const syncResult = await syncUserWithDatabase({
    clerkUserId: userId,
    requiredRole: "TEACHER",
    fallbackTeacherDepartment: invite.department,
  })

  if (!syncResult.user) {
    redirect("/no-access")
  }

  try {
    await prisma.teacherInvite.updateMany({
      data: {
        isUsed: true,
      },
      where: {
        id: invite.id,
        isUsed: false,
      },
    })
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">We could not finish setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh and try again shortly.
          </p>
        </div>
      </div>
    )
  }

  redirect("/teacher")
}