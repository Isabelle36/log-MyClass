"use client"

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import { usePathname } from "next/navigation"

type AuthHeaderClientProps = {
  adminExists: boolean
}

const HIDDEN_HEADER_PREFIXES = ["/sign-in", "/sign-up", "/teacher/invite", "/no-access"]

export default function AuthHeaderClient({ adminExists }: AuthHeaderClientProps) {
  const pathname = usePathname()

  const hideHeader = HIDDEN_HEADER_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (hideHeader) {
    return null
  }

  return (
    <header>
      <Show when="signed-out">
        <SignInButton />
        {!adminExists && <SignUpButton />}
      </Show>

      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  )
}
