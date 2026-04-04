import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function TeacherPage() {
  await requireRole("TEACHER")

  redirect("/teacher/dashboard")
}