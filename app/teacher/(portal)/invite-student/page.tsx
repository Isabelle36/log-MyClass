import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CreateStudentInviteTeacher from "@/app/teacher/CreateStudentInviteTeacher"

export default function TeacherInviteStudentPage() {
  return (
    <Card className="relative overflow-hidden rounded-[23px] border border-[#cecdcd] bg-white py-0 shadow-none ring-0">
      <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-12 h-52 w-52 rounded-full bg-[#cbeeff]/65 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-[#bec9ff]/55 blur-[45px]" />
      <CardHeader className="px-6 pb-0 pt-5">
        <CardTitle className="text-[34px] z-10 font-semibold tracking-[-1px] text-[#17181b]">Invite Student</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 px-6 pb-6 pt-4">
        <CreateStudentInviteTeacher />
      </CardContent>
    </Card>
  )
}
