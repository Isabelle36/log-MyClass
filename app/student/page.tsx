import { requireRole } from "@/lib/auth"
import { StudentDashboardClient } from "./StudentDashboardClient"

export default async function StudentPage() {
  await requireRole("STUDENT")

  return (
    <div className="p-6 md:p-10">
      <StudentDashboardClient />
    </div>
  )
}