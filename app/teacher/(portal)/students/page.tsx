import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TeacherStudentsTable from "@/app/teacher/TeacherStudentsTable"

export default function TeacherStudentsPage() {
  return (
    <Card className="rounded-[23px] border border-[#cecdcd] bg-white py-0 shadow-none ring-0">
      <CardHeader className="px-6 pb-0 pt-5">
        <CardTitle className="text-[34px] font-semibold tracking-[-1px] text-[#17181b]">View Students</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-4">
        <TeacherStudentsTable />
      </CardContent>
    </Card>
  )
}
