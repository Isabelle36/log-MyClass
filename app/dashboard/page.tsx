import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import SetupForm from "@/components/ui/SetupForm"

export default async function Dashboard() {
  const { userId } = await auth()

  if (!userId) {
    return <div>Not signed in</div>
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (!user) {
    return <SetupForm />
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Your role: {user.role}</p>
    </div>
  )
}