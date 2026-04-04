"use client"

import {
  Show,
  UserButton,
} from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"

const HIDDEN_HEADER_PREFIXES = ["/sign-in", "/sign-up", "/teacher/invite", "/teacher-attendance", "/teacher", "/student", "/scan", "/no-access", "/admin"]
const HIDDEN_HEADER_EXACT = ["/"]

export default function AuthHeaderClient() {
  const pathname = usePathname()

  const hideHeader = HIDDEN_HEADER_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (HIDDEN_HEADER_EXACT.includes(pathname)) {
    return null
  }

  if (hideHeader) {
    return null
  }

  return (
    <header>
      <Show when="signed-out">
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up" className="ml-3">Sign up</Link>
      </Show>

      <Show when="signed-in">
        <UserButton />
      </Show>
    </header>
  )
}
