import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

function AccessRestrictedMessage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-muted-foreground">
          Sign-up is invite-only for this app. Contact your institution administrator to add your
          account.
        </p>
        <Link href="/sign-in" className="text-sm font-medium underline">
          Go to sign in
        </Link>
      </div>
    </div>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    invite_token?: string | string[]
    invite_type?: string | string[]
    __clerk_ticket?: string | string[]
  }>
}) {
  const params = await searchParams
  const inviteTokenParam = params.invite_token
  const inviteTypeParam = params.invite_type
  const clerkTicketParam = params.__clerk_ticket
  const inviteToken = Array.isArray(inviteTokenParam)
    ? inviteTokenParam[0]
    : inviteTokenParam
  const inviteType = Array.isArray(inviteTypeParam)
    ? inviteTypeParam[0]
    : inviteTypeParam
  const clerkTicket = Array.isArray(clerkTicketParam)
    ? clerkTicketParam[0]
    : clerkTicketParam

  if (inviteToken) {
    let invite: { id: string; isUsed: boolean } | null = null
    const isStudentInvite = inviteType === "student"

    try {
      if (isStudentInvite) {
        invite = await prisma.studentInvite.findUnique({
          where: { token: inviteToken },
          select: { id: true, isUsed: true },
        })
      } else {
        invite = await prisma.teacherInvite.findUnique({
          where: { token: inviteToken },
          select: { id: true, isUsed: true },
        })
      }
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
      return <AccessRestrictedMessage />
    }

    const invitePath = isStudentInvite ? "/student/invite" : "/teacher/invite"
    const returnUrl = `${invitePath}?token=${encodeURIComponent(inviteToken)}`
    return (
      <div className="flex flex-col items-center gap-4">
        <SignUp
          routing="path"
          path="/sign-up"
          forceRedirectUrl={returnUrl}
          fallbackRedirectUrl={returnUrl}
        />
      </div>
    )
  }

  if (clerkTicket) {
    return (
      <div className="flex flex-col items-center gap-4">
        <SignUp
          routing="path"
          path="/sign-up"
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    )
  }

  return <AccessRestrictedMessage />
}