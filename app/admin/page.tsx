import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CreateTeacher from "../Components/CreateTeacher"

export default async function AdminPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/admin" })
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Create Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTeacher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Students CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Upload CSV</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>View Students</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}