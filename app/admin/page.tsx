import { requireRole } from "@/lib/auth"
import CreateTeacher from "../Components/CreateTeacher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdminStudentsManager from "./AdminStudentsManager"
import AdminTeachersManager from "./AdminTeachersManager"

export default async function AdminDashboard() {
  await requireRole("ADMIN")

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Admin manages only teacher onboarding. Teachers are responsible for inviting and managing
        students in their own department.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTeacher />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTeachersManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Lifecycle Management</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminStudentsManager />
        </CardContent>
      </Card>
    </div>
  )
}