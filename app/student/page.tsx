import { requireRole } from "@/lib/auth"

export default async function StudentPage() {
  const user = await requireRole("STUDENT")

  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user.role.toLowerCase()}.</p>
    </div>
  )
}