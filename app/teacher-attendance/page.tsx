import { requireRole } from "@/lib/auth"
import TeacherAttendanceLiveClient from "./TeacherAttendanceLiveClient"

export default async function TeacherAttendancePage() {
  await requireRole("TEACHER")

  return <TeacherAttendanceLiveClient />
}
