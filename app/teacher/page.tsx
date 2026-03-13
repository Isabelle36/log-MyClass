import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function TeacherPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/teacher" })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (user?.role !== "TEACHER") {
    redirect("/dashboard")
  }

  return (
    <div>
      <h1>Teacher Dashboard</h1>
    </div>
  )
}