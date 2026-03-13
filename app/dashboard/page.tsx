import { auth } from "@clerk/nextjs/server"
import SetupForm from "@/components/ui/SetupForm"
import { redirect } from "next/navigation"
import { syncUserWithDatabase } from "@/lib/auth/sync-user"


export default async function Dashboard() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" })
  }

  const synced = await syncUserWithDatabase({ clerkUserId: userId })
  const user = synced.user

  if (!user) {
    if (!synced.adminExists) {
      return <SetupForm />
    }

    // System already bootstrapped and this user is not an invited role.
    redirect("/no-access")
  }

  if (user.role === "ADMIN") redirect("/admin")
  if (user.role === "TEACHER") redirect("/teacher")
  if (user.role === "STUDENT") redirect("/student")

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Your role: {user.role}</p>
    </div>
  )
}