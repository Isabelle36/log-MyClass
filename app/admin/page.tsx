import { requireRole } from "@/lib/auth"
import CreateTeacher from "../Components/CreateTeacher"
import CreateStudentInvite from "../Components/CreateStudentInvite"
import UploadStudentsCsv from "../Components/UploadStudentsCsv"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboard() {
  await requireRole("ADMIN")

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        All onboarding runs with server-side role assignment. Teacher invites default to TEACHER and
        student invites default to STUDENT.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Invite Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTeacher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Student</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateStudentInvite />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Students CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadStudentsCsv />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}