"use client"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  FilterMailIcon,
} from "@hugeicons/core-free-icons"
import { Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type TeacherRow = {
  id: string
  fullName: string
  email: string | null
  department: string
  userId: string
  user: {
    clerkUserId: string
    email: string | null
  }
}

const DEPARTMENTS = ["BBA", "BCA"]

type TeacherFilters = {
  q: string
  department: string
}

const LOADING_ROWS = 5

export default function AdminTeachersManager() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [q, setQ] = useState("")
  const [department, setDepartment] = useState("all")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null)
  const [deletePhraseInput, setDeletePhraseInput] = useState("")

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [hasLoadedTeachers, setHasLoadedTeachers] = useState(false)

  const teachersRequestRef = useRef(0)

  const deletePhrase = deleteTarget ? `DELETE ${deleteTarget.email}` : ""

  const fetchTeachers = async (filters?: Partial<TeacherFilters>) => {
    const requestId = ++teachersRequestRef.current
    setLoading(true)

    try {
      const url = new URL("/api/admin/teachers", window.location.origin)
      const query = filters?.q ?? q
      const selectedDepartment = filters?.department ?? department

      if (query.trim()) {
        url.searchParams.set("q", query.trim())
      }
      if (selectedDepartment !== "all") {
        url.searchParams.set("department", selectedDepartment)
      }

      const res = await fetch(url.toString())
      const data = (await res.json()) as {
        teachers?: TeacherRow[]
        error?: string
      }

      if (!res.ok) {
        if (requestId === teachersRequestRef.current) {
          setTeachers([])
          toast.error(data.error ?? "Failed to fetch teachers")
        }
        return
      }

      if (requestId === teachersRequestRef.current) {
        setTeachers(data.teachers ?? [])
      }
    } catch {
      if (requestId === teachersRequestRef.current) {
        toast.error("Failed to fetch teachers")
        setTeachers([])
      }
    } finally {
      if (requestId === teachersRequestRef.current) {
        setLoading(false)
        setHasLoadedTeachers(true)
      }
    }
  }

  const deleteTeacher = async () => {
    if (!deleteTarget) {
      return
    }

    if (deletePhraseInput.trim() !== deletePhrase) {
      toast.error("Delete phrase does not match. Please type the exact phrase.")
      return
    }

    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/teachers/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete teacher")
        return
      }

      toast.success("Teacher deleted successfully")
      setDeleteOpen(false)
      setDeleteTarget(null)
      setDeletePhraseInput("")
      await fetchTeachers()
    } catch {
      toast.error("Failed to delete teacher")
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (teacher: TeacherRow) => {
    setDeleteTarget(teacher)
    setDeletePhraseInput("")
    setDeleteOpen(true)
  }

  const resetFilters = () => {
    setQ("")
    setDepartment("all")
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTeachers({ q, department })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [q, department])

  return (
    <div className="space-y-5">
      <section className="rounded-[23px] border border-[#cecdcd] bg-white p-[22px]">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-[10px]">
              <label className="flex h-[43px] w-[339px] shrink-0 items-center gap-[9px] rounded-[10px] border-[0.4px] border-[#afafaf] bg-[#f9f9f9] px-[9px] py-[3px]">
                <Search className="h-6 w-6 text-[#606060]" strokeWidth={1.8} />
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search"
                  aria-label="Search teachers"
                  className="w-full bg-transparent text-[15px] tracking-[-0.24px] text-[#3a3a3a] outline-none placeholder:text-[#8a8a8a]"
                />
              </label>

              <div className="h-[40px] min-w-[172px] shrink-0">
                <DropdownSelect
                  value={department}
                  onValueChange={setDepartment}
                  options={[
                    { value: "all", label: "Department" },
                    ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
                  ]}
                  triggerClassName="h-full min-w-[172px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                  leadingIcon={
                    <HugeiconsIcon
                      icon={Building02Icon}
                      strokeWidth={1.8}
                      className="h-[17px] w-[17px] text-[#575757]"
                    />
                  }
                  chevronClassName="h-[15px] w-[15px] text-[#767676]"
                  ariaLabel="Filter teachers by department"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[10px]">
            <Button
              type="button"
              onClick={resetFilters}
              className="relative h-[49px] cursor-pointer overflow-hidden rounded-[12px] bg-[linear-gradient(175.57452731370677deg,#6b54ff_30.611%,#6b73ff_98.377%)] px-[15px] py-[13px] text-[17px] font-semibold tracking-[-0.51px] text-white shadow-[0_8px_16px_rgba(101,92,255,0.25)] hover:brightness-105"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[-40px] h-[79px] w-[164px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_72%)]"
              />
              <HugeiconsIcon icon={FilterMailIcon} strokeWidth={1.9} className="relative mr-2 h-5 w-5" />
              <span className="relative">Clear all filters</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] tracking-[-0.42px] text-[#707070]">
            {loading && hasLoadedTeachers
              ? "Updating results..."
              : `Showing ${teachers.length} teachers`}
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-y-[9px]">
            <thead>
              <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
                <th className="px-3 py-1">Name</th>
                <th className="px-3 py-1">Email</th>
                <th className="px-3 py-1">Department</th>
                <th className="px-3 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
              {loading ? (
                Array.from({ length: LOADING_ROWS }).map((_, index) => (
                  <tr key={`teachers-loading-${index}`}>
                    <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                      <div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" />
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                      <div className="h-5 w-44 animate-pulse rounded-full bg-[#ececec]" />
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-[#ececec]" />
                    </td>
                    <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                      <div className="ml-auto h-7 w-20 animate-pulse rounded-[8px] bg-[#ececec]" />
                    </td>
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-8 text-center text-[14px] text-[#737373]"
                  >
                    No teachers found.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] font-medium text-[#1f1f1f]">
                      {teacher.fullName}
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{teacher.email ?? "-"}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{teacher.department}</td>
                    <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(teacher)}
                        disabled={actionLoading}
                        className="h-[30px] cursor-pointer rounded-[8px] px-3 text-[12px]"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Danger Zone: Delete Teacher</DialogTitle>
            <DialogDescription>
              This permanently removes the teacher and all their associated sessions.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="space-y-2">
              <p className="text-sm text-red-700">Type the exact phrase to confirm deletion:</p>
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-900">
                {deletePhrase}
              </p>
              <Input
                value={deletePhraseInput}
                onChange={(event) => setDeletePhraseInput(event.target.value)}
                placeholder="Type confirmation phrase"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteTeacher()}
              disabled={deletePhraseInput.trim() !== deletePhrase || actionLoading}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
