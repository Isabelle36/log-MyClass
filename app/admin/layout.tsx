import { requireRole } from "@/lib/auth"
import AdminShell from "./components/AdminShell"

type AdminLayoutProps = {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireRole("ADMIN")

  return <AdminShell>{children}</AdminShell>
}
