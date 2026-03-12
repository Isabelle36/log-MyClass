import { SignUp } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function Page() {
  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true }
  })

  if (adminExists) {
    redirect("/sign-in")
  }

  return <SignUp />
}