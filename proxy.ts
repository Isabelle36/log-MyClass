import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
])
const isTeacherRoute = createRouteMatcher(["/teacher(.*)"])
const isStudentRoute = createRouteMatcher(["/student(.*)"])
const isInviteRoute = createRouteMatcher([
  "/teacher/invite(.*)",
  "/student/invite(.*)",
])

function redirectToLocalSignIn(req: Request) {
  const signInUrl = new URL("/sign-in", req.url)
  signInUrl.searchParams.set("redirect_url", req.url)
  return NextResponse.redirect(signInUrl)
}

export default clerkMiddleware(async (auth, req) => {
  if (isInviteRoute(req)) {
    return NextResponse.next()
  }

  const { userId } = await auth()

  if (isAdminRoute(req)) {
    if (!userId) {
      return redirectToLocalSignIn(req)
    }
  }

  if (isTeacherRoute(req)) {
    if (!userId) {
      return redirectToLocalSignIn(req)
    }
  }

  if (isStudentRoute(req)) {
    if (!userId) {
      return redirectToLocalSignIn(req)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
