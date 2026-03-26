import { requireRole } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AttendanceSessionPanel from "./AttendanceSessionPanel"
import CreateStudentInviteTeacher from "./CreateStudentInviteTeacher"
import TeacherStudentsTable from "./TeacherStudentsTable"
import UploadStudentsCsvTeacher from "./UploadStudentsCsvTeacher"

export default async function TeacherPage() {
  await requireRole("TEACHER")

  return (
    <div className="p-6 space-y-6 md:p-10">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Manage your students and run short-lived QR attendance sessions.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Start Attendance Session</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceSessionPanel />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite Student</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateStudentInviteTeacher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Students File</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadStudentsCsvTeacher />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>View And Search Students</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherStudentsTable />
        </CardContent>
      </Card>
    </div>
  )
}