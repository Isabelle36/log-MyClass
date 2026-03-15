import { requireRole } from "@/lib/auth"

export default async function TeacherPage() {
  const user = await requireRole("TEACHER")

  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {user.role.toLowerCase()}.</p>
    </div>
  )
}