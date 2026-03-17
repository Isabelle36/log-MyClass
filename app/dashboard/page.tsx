import { getCurrentPrismaUser } from "@/lib/auth"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Dashboard() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const dbUser = await getCurrentPrismaUser()

  if (!dbUser) {
    redirect("/no-access")
  }

  if (dbUser.role === "ADMIN") redirect("/admin")
  if (dbUser.role === "TEACHER") redirect("/teacher")
  if (dbUser.role === "STUDENT") redirect("/student")

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Your role: {dbUser.role}</p>
    </div>
  )
}