"use client"

import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { figmaAssets } from "./figmaAssets"

type AdminShellProps = {
  children: React.ReactNode
}

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: figmaAssets.menuDashboard },
  { label: "Manage Teachers", href: "/admin/manage-teachers", icon: figmaAssets.menuTeachers },
  { label: "Attendance Logs", href: "/admin/attendance-logs", icon: figmaAssets.menuAttendance },
  { label: "Students List", href: "/admin/students-list", icon: figmaAssets.menuStudents },
  { label: "Invite a new Teacher", href: "/admin/invite-teacher", icon: figmaAssets.menuInvite },
] as const

const footerItems = [
  { label: "Help Center", icon: figmaAssets.footerHelp },
  { label: "Feedback", icon: figmaAssets.footerFeedback },
  { label: "Settings", icon: figmaAssets.footerSettings },
] as const

function getAdminTitle(pathname: string) {
  if (pathname.startsWith("/admin/manage-teachers")) return "Manage Teachers"
  if (pathname.startsWith("/admin/attendance-logs")) return "Attendance Logs"
  if (pathname.startsWith("/admin/students-list")) return "Students List"
  if (pathname.startsWith("/admin/invite-teacher")) return "Invite a new Teacher"
  return "Admin Dashboard"
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const title = getAdminTitle(pathname)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sidebarSearch, setSidebarSearch] = useState("")

  const query = sidebarSearch.trim().toLowerCase()

  const visibleMenuItems = useMemo(
    () =>
      menuItems.filter((item) => item.label.toLowerCase().includes(query)),
    [query]
  )

  const visibleFooterItems = useMemo(
    () =>
      footerItems.filter((item) => item.label.toLowerCase().includes(query)),
    [query]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      if (!isShortcut) {
        return
      }

      event.preventDefault()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const isMenuItemActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const showSidebarEmptyState = query.length > 0 && visibleMenuItems.length === 0 && visibleFooterItems.length === 0

  return (
    <div className="h-screen overflow-hidden bg-[#eaeaea]">
      <div className="flex h-full min-h-0">
        <aside className="hidden h-full w-[204px] shrink-0 flex-col overflow-hidden border-r border-[#c0c0c0] bg-white shadow-[inset_-1px_0px_0px_0px_white] md:flex">
          <div className="flex items-center gap-[5px] px-[14px] pt-[28px]">
            <div className="relative h-[24px] w-[25px] shrink-0">
              <img src={figmaAssets.logoMark} alt="Logmyclass icon" className="h-full w-full object-cover" />
            </div>
            <div className="relative h-[29px] w-[134px]">
              <img src="/Logmyclass.png" alt="Logmyclass" className="h-full w-full object-contain" />
            </div>
            <div className="ml-auto flex items-center pr-[8px]">
              <img src={figmaAssets.chevronSmall} alt="Collapse" className="mr-[-8px] h-[14px] w-[14px] -rotate-90" />
              <img src={figmaAssets.chevronSmall} alt="Collapse" className="mr-[-8px] h-[14px] w-[14px] -rotate-90" />
            </div>
          </div>

          <div className="mt-[28px] px-[8px]">
            <label className="flex h-[35px] w-full items-center justify-between overflow-hidden rounded-[6px] border-[0.4px] border-[#bcbcbc] bg-white px-[9px]">
              <div className="flex min-w-0 items-center gap-[6px]">
                <img src={figmaAssets.sidebarSearch} alt="Search" className="h-[16px] w-[16px] shrink-0" />
                <input
                  ref={searchInputRef}
                  value={sidebarSearch}
                  onChange={(event) => setSidebarSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setSidebarSearch("")
                      event.currentTarget.blur()
                    }
                  }}
                  placeholder="Search"
                  aria-label="Search sidebar tabs"
                  className="w-full bg-transparent text-[14px] font-medium tracking-[-0.56px] text-black outline-none placeholder:text-black"
                />
              </div>
              <div className="ml-2 flex h-[18px] w-[35px] items-center rounded-[5px] bg-[#ebebeb] px-[5px]">
                <img src={figmaAssets.sidebarCommand} alt="Command" className="h-[12px] w-[12px]" />
                <span className="ml-auto text-[10px] tracking-[-0.4px] text-black">k</span>
              </div>
            </label>
          </div>

          <div className="mt-[27px] px-[10px]">
            <div className="space-y-[10px]">
              <p className="text-[18px] font-semibold tracking-[-0.72px] text-black">Menu</p>
              <div className="h-px bg-[#d9d9d9] shadow-[inset_0px_-0.4px_0px_0px_white]" />
            </div>
            <nav className="mt-[22px] space-y-[22px]">
              {visibleMenuItems.map((item) => {
                const active = isMenuItemActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-[6px] text-[18px] font-medium tracking-[-0.72px] text-black transition-opacity duration-200",
                      active ? "opacity-100" : "opacity-55 hover:opacity-80"
                    )}
                  >
                    <img src={item.icon} alt="" className="h-[18px] w-[18px]" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {query.length > 0 && visibleMenuItems.length === 0 ? (
                <p className="text-[13px] font-medium tracking-[-0.52px] text-[#707070]">No menu matches</p>
              ) : null}
            </nav>
          </div>

          <div className="mt-auto px-[13px] pb-[16px]">
            <div className="space-y-[12px]">
              {visibleFooterItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "flex items-center gap-[6px] text-[18px] font-medium tracking-[-0.72px] text-black transition-opacity duration-200",
                    query.length > 0 ? "opacity-100" : "opacity-55 hover:opacity-80"
                  )}
                >
                  <img src={item.icon} alt="" className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              ))}
              {query.length > 0 && visibleFooterItems.length === 0 ? (
                <p className="text-[13px] font-medium tracking-[-0.52px] text-[#707070]">No support matches</p>
              ) : null}
              {showSidebarEmptyState ? (
                <p className="text-[12px] font-medium tracking-[-0.48px] text-[#8b8b8b]">Try another keyword.</p>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="h-[78px] border-b border-[#c0c0c0] bg-[#eaeaea] px-[11px] shadow-[inset_0px_-1px_0px_0px_white]">
            <div className="flex h-full items-center justify-between">
              <div className="flex items-center gap-[9px]">
                <img src={figmaAssets.navHome} alt="Home" className="h-[26px] w-[26px]" />
                <p className="text-[20px] tracking-[-0.8px] text-[#313131]">{title}</p>
              </div>

              <div className="flex items-center gap-[32px]">
                <img src={figmaAssets.navNotification} alt="Notifications" className="h-[28px] w-[24px] hover:opacity-70 cursor-pointer" />
                <div className="relative">
                  <div className="pointer-events-none absolute -inset-[2px] rounded-full bg-[linear-gradient(135deg,rgba(144,195,255,0.65),rgba(196,170,255,0.7),rgba(153,227,193,0.65))] blur-[1.5px]" />
                  <div className="relative flex h-[51px] w-[51px] items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(168,168,168,0.25)] shadow-[0_8px_20px_rgba(0,0,0,0.16)] ring-1 ring-white/70 transition-transform duration-200 hover:scale-[1.03]">
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-[47px] w-[47px]",
                          userButtonTrigger:
                            "h-[47px] w-[47px] rounded-full !bg-transparent hover:!bg-transparent focus:!bg-transparent active:!bg-transparent data-[state=open]:!bg-transparent",
                        },
                      }}
                    />
                  </div>
                  <span className="pointer-events-none absolute bottom-[2px] right-[2px] h-[10px] w-[10px] rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
              </div>
            </div>
          </header>

          <div className="border-b border-[#c0c0c0] bg-[#eaeaea] px-3 py-2 md:hidden">
            <div className="flex flex-wrap gap-2">
              {menuItems.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border border-[#d3d3d3] bg-white px-3 py-1 text-xs text-[#3d3d3d]",
                      active && "border-[#6b54ff] text-[#3a2fb1]"
                    )}
                  >
                    <img src={item.icon} alt="" className="h-[12px] w-[12px]" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[14px] pb-[14px] pt-[20px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
