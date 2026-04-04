import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AttendanceSessionPanel from "../../AttendanceSessionPanel"
import TeacherRecentAttendanceTable from "../../TeacherRecentAttendanceTable"

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-5">
      <Card className="rounded-[23px] border border-[#cecdcd] bg-white py-0 shadow-none ring-0">
        <CardHeader className="px-6 pb-0 pt-5">
          <CardTitle className="text-[34px] font-semibold tracking-[-1px] text-[#17181b]">
            Start Attendance Session
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-4">
          <AttendanceSessionPanel />
        </CardContent>
      </Card>

      <TeacherRecentAttendanceTable />
    </div>
  )
}
