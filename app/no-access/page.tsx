"use client"

import { useClerk } from "@clerk/nextjs"
import { useEffect } from "react"

export default function NoAccessPage() {
  const { signOut } = useClerk()

  useEffect(() => {
    // Immediately sign out the Clerk session so they can't navigate back
    // into protected routes while still holding a valid Clerk token
    signOut({ redirectUrl: "/sign-in" })
  }, [signOut])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">
        Your account does not have access to this system. Contact your
        institution administrator to receive an invite.
      </p>
      <p className="text-sm text-gray-400">Signing you out…</p>
    </div>
  )
}
