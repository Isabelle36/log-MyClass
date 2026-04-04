import { requireRole } from "@/lib/auth"
import TeacherShell from "../components/TeacherShell"

type TeacherPortalLayoutProps = {
  children: React.ReactNode
}

export default async function TeacherPortalLayout({ children }: TeacherPortalLayoutProps) {
  await requireRole("TEACHER")

  return <TeacherShell>{children}</TeacherShell>
}
