import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function StudentPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/student" })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (user?.role !== "STUDENT") {
    redirect("/dashboard")
  }

  return (
    <div>
      <h1>Student Dashboard</h1>
    </div>
  )
}