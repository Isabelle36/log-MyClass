import { SignUp } from "@clerk/nextjs"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    invite_token?: string | string[]
    __clerk_ticket?: string | string[]
  }>
}) {
  const params = await searchParams
  const inviteTokenParam = params.invite_token
  const inviteToken = Array.isArray(inviteTokenParam)
    ? inviteTokenParam[0]
    : inviteTokenParam
  const clerkTicketParam = params.__clerk_ticket
  const clerkTicket = Array.isArray(clerkTicketParam)
    ? clerkTicketParam[0]
    : clerkTicketParam

  if (inviteToken) {
    let invite: { id: string; isUsed: boolean } | null = null
    try {
      invite = await prisma.teacherInvite.findUnique({
        where: { token: inviteToken },
        select: { id: true, isUsed: true },
      })
    } catch {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold">Database temporarily unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please retry this invite link in a minute.
            </p>
          </div>
        </div>
      )
    }

    if (!invite || invite.isUsed) {
      notFound()
    }

    if (!clerkTicket) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-xl font-semibold">Use the invitation email link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This sign-up is invite-only. Open the invitation link from your
              email so Clerk can include a valid invite ticket.
            </p>
          </div>
        </div>
      )
    }

    const returnUrl = `/teacher/invite?token=${encodeURIComponent(inviteToken)}`
    return (
      <div className="flex flex-col items-center gap-4">
        <SignUp
          routing="hash"
          ticket={clerkTicket}
          forceRedirectUrl={returnUrl}
          fallbackRedirectUrl={returnUrl}
        />
      </div>
    )
  }

  let adminExists = null
  try {
    adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true }
    })
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Database temporarily unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign-up is unavailable until the database connection is restored.
          </p>
        </div>
      </div>
    )
  }

  // Once system is bootstrapped, open sign-up is closed.
  // Only invite-link sign-ups (handled above) are allowed.
  if (adminExists) {
    notFound()
  }

  // Pre-bootstrap: first admin can sign up here to get to the setup key form
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp routing="hash" fallbackRedirectUrl="/dashboard" />
    </div>
  )
}