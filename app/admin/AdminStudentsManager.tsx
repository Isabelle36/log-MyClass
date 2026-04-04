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
  Calendar03Icon,
  Edit02Icon,
  FilterHorizontalIcon,
  FilterMailIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

type StudentRow = {
  id: string
  fullName: string
  email: string | null
  department: string
  year: number
  rollNo: number
  isActive: boolean
  academicYear: string
}

type AttendanceLog = {
  id: string
  status: "PRESENT" | "ABSENT" | "EXCUSED"
  createdAt: string
  student: {
    id: string
    fullName: string
    rollNo: number
    department: string
    year: number
  }
  session: {
    id: string
    subject: string
    department: string
    year: number
    teacherName: string
  }
}

type PromoteResponse = {
  mode: "promote"
  department: string
  sourceYear: number
  targetYear: number
  total: number
  promoted: number
  failed: number
  error?: string
}

const DEPARTMENTS = ["BBA", "BCA"]
const ROWS_PER_PAGE = 6

type StudentFilters = {
  q: string
  department: string
  year: string
  isActive: string
}

type AdminStudentsManagerProps = {
  showRoster?: boolean
  includeAttendanceLogs?: boolean
}

export default function AdminStudentsManager({
  showRoster = true,
  includeAttendanceLogs = true,
}: AdminStudentsManagerProps = {}) {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "ABSENT" | "PRESENT" | "EXCUSED">("all")

  const [q, setQ] = useState("")
  const [department, setDepartment] = useState("all")
  const [year, setYear] = useState("all")
  const [isActive, setIsActive] = useState("all")
  const [studentPage, setStudentPage] = useState(1)

  const [logQuery, setLogQuery] = useState("")
  const [logDepartment, setLogDepartment] = useState("all")
  const [logYear, setLogYear] = useState("all")
  const [logPage, setLogPage] = useState(1)

  const [promoteOpen, setPromoteOpen] = useState(false)
  const [bulkDepartment, setBulkDepartment] = useState("BCA")
  const [sourceYear, setSourceYear] = useState("1")
  const [targetYear, setTargetYear] = useState("2")
  const [academicYear, setAcademicYear] = useState("")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null)
  const [deletePhraseInput, setDeletePhraseInput] = useState("")

  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [hasLoadedStudents, setHasLoadedStudents] = useState(false)

  const studentsRequestRef = useRef(0)
  const logsRequestRef = useRef(0)

  const [editOpen, setEditOpen] = useState(false)
  const [editLog, setEditLog] = useState<AttendanceLog | null>(null)
  const [editStatus, setEditStatus] = useState<"PRESENT" | "EXCUSED">("PRESENT")
  const [editLoading, setEditLoading] = useState(false)

  const canEditAttendance = (editLog?.status ?? "").toUpperCase() === "ABSENT"

  const deletePhrase = deleteTarget
    ? `DELETE ${deleteTarget.fullName} (${deleteTarget.rollNo})`
    : ""

  const fetchStudents = async (filters?: Partial<StudentFilters>) => {
    const requestId = ++studentsRequestRef.current
    setLoading(true)

    try {
      const url = new URL("/api/admin/students", window.location.origin)
      const query = filters?.q ?? q
      const selectedDepartment = filters?.department ?? department
      const selectedYear = filters?.year ?? year
      const selectedIsActive = filters?.isActive ?? isActive

      if (query.trim()) {
        url.searchParams.set("q", query.trim())
      }
      if (selectedDepartment !== "all") {
        url.searchParams.set("department", selectedDepartment)
      }
      if (selectedYear !== "all") {
        url.searchParams.set("year", selectedYear)
      }
      if (selectedIsActive !== "all") {
        url.searchParams.set("isActive", selectedIsActive)
      }

      const res = await fetch(url.toString())
      const data = (await res.json()) as {
        students?: StudentRow[]
        error?: string
      }

      if (!res.ok) {
        if (requestId === studentsRequestRef.current) {
          setStudents([])
        }
        return
      }

      if (requestId === studentsRequestRef.current) {
        setStudents(data.students ?? [])
      }
    } catch {
      if (requestId === studentsRequestRef.current) {
        setStudents([])
      }
    } finally {
      if (requestId === studentsRequestRef.current) {
        setLoading(false)
        setHasLoadedStudents(true)
      }
    }
  }

  const fetchLogs = async (studentId?: string) => {
    const requestId = ++logsRequestRef.current
    setLogsLoading(true)

    try {
      const url = new URL("/api/admin/students/attendance", window.location.origin)
      if (studentId) {
        url.searchParams.set("studentId", studentId)
      }

      const res = await fetch(url.toString())
      const data = (await res.json()) as {
        logs?: AttendanceLog[]
        error?: string
      }

      if (requestId !== logsRequestRef.current) return

      if (!res.ok) {
        setLogs([])
        return
      }

      setLogs(data.logs ?? [])
    } catch {
      if (requestId === logsRequestRef.current) setLogs([])
    } finally {
      if (requestId === logsRequestRef.current) {
        setLogsLoading(false)
      }
    }
  }

  const updateStudent = async (studentId: string, nextActive: boolean) => {
    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      })

      const data = (await res.json()) as {
        error?: string
      }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update student")
        return
      }

      toast.success(
        nextActive ? "Student activated. Attendance and scan are enabled." : "Student deactivated. Attendance and scan are blocked."
      )

      await fetchStudents()
    } catch {
      toast.error("Failed to update student")
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (student: StudentRow) => {
    setDeleteTarget(student)
    setDeletePhraseInput("")
    setDeleteOpen(true)
  }

  const deleteStudent = async () => {
    if (!deleteTarget) {
      return
    }

    if (deletePhraseInput.trim() !== deletePhrase) {
      toast.error("Delete phrase does not match. Please type the exact phrase.")
      return
    }

    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/students/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete student")
        return
      }

      toast.success("Student deleted successfully")
      if (selectedStudentId === deleteTarget.id) {
        setSelectedStudentId("")
        setLogs([])
      }
      setDeleteOpen(false)
      setDeleteTarget(null)
      setDeletePhraseInput("")
      await fetchStudents()
    } catch {
      toast.error("Failed to delete student")
    } finally {
      setActionLoading(false)
    }
  }

  const runBulkPromote = async () => {
    setBulkLoading(true)

    try {
      const formData = new FormData()
      formData.set("mode", "promote")
      formData.set("department", bulkDepartment)
      formData.set("sourceYear", sourceYear)
      formData.set("targetYear", targetYear)
      if (academicYear.trim()) {
        formData.set("academicYear", academicYear.trim())
      }

      const res = await fetch("/api/admin/students/batch-sync", {
        method: "POST",
        body: formData,
      })

      const data = (await res.json()) as PromoteResponse

      if (!res.ok) {
        toast.error(data.error ?? "Batch promotion failed")
        return
      }

      toast.success(
        `${data.department} Year ${data.sourceYear} -> Year ${data.targetYear}: ${data.promoted}/${data.total} promoted, ${data.failed} conflicts.`
      )
      setPromoteOpen(false)
      await fetchStudents()
    } catch {
      toast.error("Batch promotion failed")
    } finally {
      setBulkLoading(false)
    }
  }

  const activeCount = useMemo(
    () => students.filter((student) => student.isActive).length,
    [students]
  )

  const filteredLogs = useMemo(() => {
    const queryText = logQuery.trim().toLowerCase()

    return logs.filter((log) => {
      const normalizedStatus = String(log.status ?? "").toUpperCase()
      if (logStatusFilter !== "all" && normalizedStatus !== logStatusFilter) {
        return false
      }

      if (logDepartment !== "all" && log.student.department !== logDepartment) {
        return false
      }

      if (logYear !== "all" && String(log.student.year) !== logYear) {
        return false
      }

      if (!queryText) {
        return true
      }

      const searchBlob = [
        log.student.fullName,
        String(log.student.rollNo),
        log.student.department,
        log.session.teacherName,
        log.session.subject,
      ]
        .join(" ")
        .toLowerCase()

      return searchBlob.includes(queryText)
    })
  }, [logs, logStatusFilter, logQuery, logDepartment, logYear])

  const absentLogsCount = useMemo(
    () => logs.filter((log) => String(log.status ?? "").toUpperCase() === "ABSENT").length,
    [logs]
  )

  const studentTotalPages = Math.max(1, Math.ceil(students.length / ROWS_PER_PAGE))
  const currentStudentPage = Math.min(studentPage, studentTotalPages)
  const pagedStudents = useMemo(() => {
    const start = (currentStudentPage - 1) * ROWS_PER_PAGE
    return students.slice(start, start + ROWS_PER_PAGE)
  }, [students, currentStudentPage])

  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE))
  const currentLogPage = Math.min(logPage, logTotalPages)
  const pagedLogs = useMemo(() => {
    const start = (currentLogPage - 1) * ROWS_PER_PAGE
    return filteredLogs.slice(start, start + ROWS_PER_PAGE)
  }, [filteredLogs, currentLogPage])

  const logYearOptions = useMemo(() => {
    const years = new Set<number>([1, 2, 3])
    for (const log of logs) {
      years.add(log.student.year)
    }
    return Array.from(years).sort((a, b) => a - b)
  }, [logs])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStudents({ q, department, year, isActive })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [q, department, year, isActive])

  useEffect(() => {
    setStudentPage(1)
  }, [q, department, year, isActive])

  useEffect(() => {
    if (studentPage > studentTotalPages) {
      setStudentPage(studentTotalPages)
    }
  }, [studentPage, studentTotalPages])

 

  // Update logs when student selection changes.
  useEffect(() => {
    if (!includeAttendanceLogs) {
      return
    }

    void fetchLogs(selectedStudentId || undefined)
  }, [selectedStudentId, includeAttendanceLogs])

  useEffect(() => {
    setLogPage(1)
  }, [logQuery, logDepartment, logYear, logStatusFilter, selectedStudentId])

  useEffect(() => {
    if (logPage > logTotalPages) {
      setLogPage(logTotalPages)
    }
  }, [logPage, logTotalPages])

  const resetStudentFilters = () => {
    setQ("")
    setDepartment("all")
    setYear("all")
    setIsActive("all")
    setSelectedStudentId("")
    setStudentPage(1)
  }

  const resetLogFilters = () => {
    setLogQuery("")
    setLogDepartment("all")
    setLogYear("all")
    setLogStatusFilter("all")
    setSelectedStudentId("")
    setLogPage(1)
  }

  const formatDate = (value: string) => {
    const dt = new Date(value)
    const monthNames = ["january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"]
    return `${dt.getDate()} ${monthNames[dt.getMonth()]} ${dt.getFullYear()}`
  }

  const formatTime = (value: string) => {
    return new Date(value).toLocaleTimeString()
  }

  return (
    <div className="space-y-5">
      {showRoster ? (
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
                    aria-label="Search students"
                    className="w-full bg-transparent text-[15px] tracking-[-0.24px] text-[#3a3a3a] outline-none placeholder:text-[#8a8a8a]"
                  />
                </label>

                <div className="h-[40px] min-w-[162px] shrink-0">
                  <DropdownSelect
                    value={department}
                    onValueChange={setDepartment}
                    options={[
                      { value: "all", label: "Department" },
                      ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
                    ]}
                    triggerClassName="h-full min-w-[162px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={Building02Icon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter students by department"
                  />
                </div>

                <div className="h-[40px] min-w-[128px] shrink-0">
                  <DropdownSelect
                    value={year}
                    onValueChange={setYear}
                    options={[
                      { value: "all", label: "Year" },
                      { value: "1", label: "1st" },
                      { value: "2", label: "2nd" },
                      { value: "3", label: "3rd" },
                    ]}
                    triggerClassName="h-full min-w-[128px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter students by year"
                  />
                </div>

                <div className="h-[40px] min-w-[136px] shrink-0">
                  <DropdownSelect
                    value={isActive}
                    onValueChange={setIsActive}
                    options={[
                      { value: "all", label: "Status" },
                      { value: "true", label: "Active" },
                      { value: "false", label: "Restricted" },
                    ]}
                    triggerClassName="h-full min-w-[136px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={FilterHorizontalIcon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter students by status"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[10px]">
              <Button
                type="button"
                onClick={resetStudentFilters}
                className="relative cursor-pointer h-[49px] overflow-hidden rounded-[12px] bg-[linear-gradient(175.57452731370677deg,#6b54ff_30.611%,#6b73ff_98.377%)] px-[15px] py-[13px] text-[17px] font-semibold tracking-[-0.51px] text-white shadow-[0_8px_16px_rgba(101,92,255,0.25)] hover:brightness-105"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[-40px] h-[79px] w-[164px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_72%)]"
                />
                <HugeiconsIcon icon={FilterMailIcon} strokeWidth={1.9} className="relative mr-2 h-5 w-5" />
                <span className="relative">Clear all filters</span>
              </Button>
              <Button
                type="button"
                onClick={() => setPromoteOpen(true)}
                className="h-[40px] cursor-pointer rounded-[10px] border border-[#2e2e2e] bg-[linear-gradient(180deg,#2a2a2a_0%,#101010_100%)] px-4 text-[14px] font-semibold tracking-[-0.3px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.26)] hover:brightness-110"
              >
                Promote Batch
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] tracking-[-0.42px] text-[#707070]">
              {loading && hasLoadedStudents
                ? "Updating results..."
                : `Showing ${students.length} students (${activeCount} active)`}
            </p>
            {includeAttendanceLogs && selectedStudentId ? (
              <Button
                type="button"
                variant="outline"
                className="h-[32px] cursor-pointer rounded-[8px] border-[#c9c9c9] px-3 text-[13px] text-[#4a4a4a]"
                onClick={() => setSelectedStudentId("")}
              >
                Clear selection
              </Button>
            ) : null}
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1020px] border-separate border-spacing-y-[9px]">
              <thead>
                <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
                  <th className="px-3 py-1">Name</th>
                  <th className="px-3 py-1">Email</th>
                  <th className="px-3 py-1">Department</th>
                  <th className="px-3 py-1">Year</th>
                  <th className="px-3 py-1">Roll</th>
                  <th className="px-3 py-1">Status</th>
                  <th className="px-3 py-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
                {loading ? (
                  Array.from({ length: ROWS_PER_PAGE }).map((_, index) => (
                    <tr key={`students-loading-${index}`}>
                      <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-40 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-20 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-14 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-12 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-7 w-20 animate-pulse rounded-[8px] bg-[#ececec]" />
                      </td>
                      <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="ml-auto h-7 w-40 animate-pulse rounded-[8px] bg-[#ececec]" />
                      </td>
                    </tr>
                  ))
                ) : pagedStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-8 text-center text-[14px] text-[#737373]"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  pagedStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] font-medium text-[#1f1f1f]">
                        {student.fullName}
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.email ?? "-"}</td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.department}</td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{formatYearSuffix(student.year)}</td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.rollNo}</td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-[8px] border px-[11px] py-[2px] text-[13px] tracking-[-0.2px]",
                            student.isActive
                              ? "border-[#8beba8] bg-[#e2fdea] text-[#2f8e53]"
                              : "border-[#eb938b] bg-[#fde2e2] text-[#cd2213]"
                          )}
                        >
                          {student.isActive ? "Active" : "Restricted"}
                        </span>
                      </td>
                      <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] text-right">
                        <div className="flex items-center justify-end gap-2">
                          {includeAttendanceLogs ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudentId(student.id)}
                              disabled={actionLoading}
                              className="h-[30px] rounded-[8px] border-[#d4d4d4] px-3 text-[12px]"
                            >
                              Logs
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void updateStudent(student.id, !student.isActive)}
                            disabled={actionLoading}
                            className="h-[30px] rounded-[8px] border-[#d4d4d4] px-3 text-[12px]"
                          >
                            {student.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(student)}
                            disabled={actionLoading}
                            className="h-[30px] rounded-[8px] px-3 text-[12px]"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] tracking-[-0.3px] text-[#747474]">Showing Page {currentStudentPage} of {studentTotalPages}</p>
            <PaginationControls
              currentPage={currentStudentPage}
              totalPages={studentTotalPages}
              onPageChange={setStudentPage}
            />
          </div>
        </section>
      ) : null}

      {includeAttendanceLogs ? (
        <section className="rounded-[23px] border border-[#cecdcd] bg-white p-[22px]">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-[10px]">
                <label className="flex h-[43px] w-[339px] shrink-0 items-center gap-[9px] rounded-[10px] border-[0.4px] border-[#afafaf] bg-[#f9f9f9] px-[9px] py-[3px]">
                  <Search className="h-6 w-6 text-[#606060]" strokeWidth={1.8} />
                  <input
                    value={logQuery}
                    onChange={(event) => setLogQuery(event.target.value)}
                    placeholder="Search"
                    aria-label="Search attendance logs"
                    className="w-full bg-transparent text-[15px] tracking-[-0.24px] text-[#3a3a3a] outline-none placeholder:text-[#8a8a8a]"
                  />
                </label>

                <div className="h-[40px] min-w-[162px] shrink-0">
                  <DropdownSelect
                    value={logDepartment}
                    onValueChange={setLogDepartment}
                    options={[
                      { value: "all", label: "Department" },
                      ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
                    ]}
                    triggerClassName="h-full min-w-[162px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={Building02Icon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter logs by department"
                  />
                </div>

                <div className="h-[40px] min-w-[128px] shrink-0">
                  <DropdownSelect
                    value={logYear}
                    onValueChange={setLogYear}
                    options={[
                      { value: "all", label: "Year" },
                      ...logYearOptions.map((optionYear) => ({
                        value: String(optionYear),
                        label: formatYearSuffix(optionYear),
                      })),
                    ]}
                    triggerClassName="h-full min-w-[128px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter logs by year"
                  />
                </div>

                <div className="h-[40px] min-w-[136px] shrink-0">
                  <DropdownSelect
                    value={logStatusFilter}
                    onValueChange={(value) =>
                      setLogStatusFilter(value as "all" | "ABSENT" | "PRESENT" | "EXCUSED")
                    }
                    options={[
                      { value: "all", label: "Status" },
                      { value: "PRESENT", label: "Present" },
                      { value: "ABSENT", label: "Absent" },
                      { value: "EXCUSED", label: "Excused" },
                    ]}
                    triggerClassName="h-full min-w-[136px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white pl-[36px] pr-8 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                    leadingIcon={
                      <HugeiconsIcon
                        icon={FilterHorizontalIcon}
                        strokeWidth={1.8}
                        className="h-[17px] w-[17px] text-[#575757]"
                      />
                    }
                    chevronClassName="h-[15px] w-[15px] text-[#767676]"
                    ariaLabel="Filter logs by status"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[10px]">
              <Button
                type="button"
                onClick={resetLogFilters}
                className="relative h-[49px] overflow-hidden rounded-[12px] bg-[linear-gradient(175.57452731370677deg,#6b54ff_30.611%,#6b73ff_98.377%)] px-[15px] py-[13px] text-[17px] font-semibold tracking-[-0.51px] text-white shadow-[0_8px_16px_rgba(101,92,255,0.25)] hover:brightness-105"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[-40px] h-[79px] w-[164px] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0)_72%)]"
                />
                <HugeiconsIcon icon={FilterMailIcon} strokeWidth={1.9} className="relative mr-2 h-5 w-5" />
                <span className="relative">Clear all filters</span>
              </Button>
              {selectedStudentId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedStudentId("")}
                  className="h-[40px] rounded-[10px] border-[#d8d8d8] bg-white px-4 text-[14px] font-semibold tracking-[-0.3px] text-[#333333] hover:bg-[#f6f6f6]"
                >
                  Show all logs
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] tracking-[-0.42px] text-[#707070]">
              {selectedStudentId
                ? `Showing logs for ${students.find((s) => s.id === selectedStudentId)?.fullName ?? "selected student"}.`
                : "Showing all students' attendance history."}
            </p>
            <p className="text-[14px] tracking-[-0.42px] text-[#707070]">
              Total: {filteredLogs.length} • Absent: {absentLogsCount}
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1260px] border-separate border-spacing-y-[9px]">
              <thead>
                <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
                  <th className="px-3 py-1">Date</th>
                  <th className="px-3 py-1">Time</th>
                  <th className="px-3 py-1">Student</th>
                  <th className="px-3 py-1">Roll</th>
                  <th className="px-3 py-1">Year</th>
                  <th className="px-3 py-1">Class</th>
                  <th className="px-3 py-1">Teacher</th>
                  <th className="px-3 py-1">Subject</th>
                  <th className="px-3 py-1">Status</th>
                  <th className="px-3 py-1 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
                {logsLoading ? (
                  Array.from({ length: ROWS_PER_PAGE }).map((_, index) => (
                    <tr key={`logs-loading-${index}`}>
                      <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                        <div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-24 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-12 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-12 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-16 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-28 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-24 animate-pulse rounded-full bg-[#ececec]" /></td>
                      <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-7 w-20 animate-pulse rounded-[8px] bg-[#ececec]" /></td>
                      <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="ml-auto h-7 w-8 animate-pulse rounded-[8px] bg-[#ececec]" /></td>
                    </tr>
                  ))
                ) : pagedLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-8 text-center text-[14px] text-[#737373]"
                    >
                      {logs.length === 0 ? "No logs found." : "No logs found for selected filters."}
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((log) => {
                    const normalizedStatus = String(log.status ?? "").toUpperCase()

                    return (
                      <tr key={log.id}>
                        <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{formatDate(log.createdAt)}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{formatTime(log.createdAt)}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] font-medium text-[#1f1f1f]">{log.student.fullName}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{log.student.rollNo}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{formatYearSuffix(log.student.year)}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{log.student.department}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{log.session.teacherName}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{log.session.subject}</td>
                        <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-[8px] border px-[11px] py-[2px] text-[13px] tracking-[-0.2px]",
                              normalizedStatus === "PRESENT"
                                ? "border-[#8beba8] bg-[#e2fdea] text-[#2f8e53]"
                                : normalizedStatus === "EXCUSED"
                                  ? "border-[#dbe63a] bg-[#fdfed6] text-[#868637]"
                                  : "border-[#eb938b] bg-[#fde2e2] text-[#cd2213]"
                            )}
                          >
                            {normalizedStatus === "PRESENT"
                              ? "Present"
                              : normalizedStatus === "EXCUSED"
                                ? "Excused"
                                : "Absent"}
                          </span>
                        </td>
                        <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] text-right">
                          {normalizedStatus === "ABSENT" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={editLoading}
                              onClick={() => {
                                setEditLog(log)
                                setEditStatus("PRESENT")
                                setEditOpen(true)
                              }}
                              className="h-8 w-8 text-slate-500 hover:text-slate-900"
                              aria-label="Edit attendance"
                            >
                              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-base text-[#7a7a7a]">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] tracking-[-0.3px] text-[#747474]">Showing Page {currentLogPage} of {logTotalPages}</p>
            <PaginationControls
              currentPage={currentLogPage}
              totalPages={logTotalPages}
              onPageChange={setLogPage}
            />
          </div>
        </section>
      ) : null}

      {showRoster ? (
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Batch</DialogTitle>
            <button
              type="button"
              onClick={() => setPromoteOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogDescription>
              Admin-only action. Promote one batch to the next year in one click.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <DropdownSelect
              value={bulkDepartment}
              onValueChange={setBulkDepartment}
              options={[
                { value: "BBA", label: "BBA" },
                { value: "BCA", label: "BCA" },
              ]}
              triggerClassName="h-9 rounded-4xl"
              ariaLabel="Promote batch department"
            />

            <div className="grid grid-cols-2 gap-2">
              <DropdownSelect
                value={sourceYear}
                onValueChange={setSourceYear}
                options={[
                  { value: "1", label: "From 1st Year" },
                  { value: "2", label: "From 2nd Year" },
                  { value: "3", label: "From 3rd Year" },
                ]}
                triggerClassName="h-9 rounded-4xl"
                ariaLabel="Promote batch source year"
              />

              <DropdownSelect
                value={targetYear}
                onValueChange={setTargetYear}
                options={[
                  { value: "1", label: "To 1st Year" },
                  { value: "2", label: "To 2nd Year" },
                  { value: "3", label: "To 3rd Year" },
                ]}
                triggerClassName="h-9 rounded-4xl"
                ariaLabel="Promote batch target year"
              />
            </div>

            <Input
              placeholder="Academic year label (optional, e.g. 2026-27)"
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void runBulkPromote()}
              disabled={bulkLoading}
              className="bg-linear-to-b cursor-pointer from-[#6b68ff] to-[#0c29ba] text-white hover:brightness-105"
            >
              {bulkLoading ? "Promoting..." : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      {showRoster ? (
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Danger Zone: Delete Student</DialogTitle>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogDescription>
              This permanently removes the student and their attendance logs.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                Type the exact phrase to confirm deletion:
              </p>
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
            <Button variant="outline" className="cursor-pointer" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => void deleteStudent()}
              disabled={deletePhraseInput.trim() !== deletePhrase || actionLoading}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      {includeAttendanceLogs ? (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>
              Only absent attendance can be edited. You can change it to
              <span className="font-semibold"> Present</span> or
              <span className="font-semibold"> Excused</span>.
            </DialogDescription>
          </DialogHeader>

          {editLog && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-md bg-slate-50 px-3 py-2">
                <p className="font-medium">{editLog.student.fullName} (Roll {editLog.student.rollNo})</p>
                <p className="text-xs text-slate-500">
                  {editLog.session.subject} • {formatDate(editLog.createdAt)} at {formatTime(editLog.createdAt)}
                </p>
              </div>

              {canEditAttendance ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Set status to
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer"
                      variant={editStatus === "PRESENT" ? "default" : "outline"}
                      onClick={() => setEditStatus("PRESENT")}
                    >
                      Present
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer"
                      variant={editStatus === "EXCUSED" ? "default" : "outline"}
                      onClick={() => setEditStatus("EXCUSED")}
                    >
                      Excused
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  This record is already {editLog.status.toLowerCase()}. Editing is allowed only for absent records.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setEditOpen(false)
                setEditLog(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={editLoading || !editLog || !canEditAttendance}
              onClick={async () => {
                if (!editLog) return
                if (editLog.status.toUpperCase() !== "ABSENT") {
                  toast.error("Only absent records can be changed")
                  return
                }

                setEditLoading(true)
                try {
                  const res = await fetch(`/api/admin/students/attendance/${editLog.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: editStatus }),
                  })

                  const data = (await res.json()) as { error?: string }
                  if (!res.ok) {
                    toast.error(data.error ?? "Failed to update attendance")
                    return
                  }

                  toast.success(
                    editStatus === "PRESENT" ? "Marked as present" : "Marked as excused"
                  )
                  await fetchLogs(selectedStudentId)
                  setEditOpen(false)
                  setEditLog(null)
                } catch {
                  toast.error("Failed to update attendance")
                } finally {
                  setEditLoading(false)
                }
              }}
            >
              {editLoading ? "Saving..." : "Confirm change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}
    </div>
  )
}

type PaginationControlsProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const pageItems = buildPaginationItems(currentPage, totalPages)

  return (
    <div className="flex items-center gap-[6px]">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="flex h-8 cursor-pointer w-8 items-center justify-center rounded-[8px] border border-[#b1b1b1] bg-[#fafafa] text-[#5e5e5e] disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageItems.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-[18px] text-[#5e5e5e]">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={cn(
              "h-8 min-w-[32px] cursor-pointer rounded-[8px] border px-2 text-[16px] tracking-[-0.48px]",
              item === currentPage
                ? "border-[#1f1f1f] bg-[#1f1f1f] text-white"
                : "border-[#b1b1b1] bg-[#fafafa] text-[#5e5e5e]"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-[#b1b1b1] bg-[#fafafa] text-[#5e5e5e] disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([
    1,
    2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages - 1,
    totalPages,
  ])

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const result: Array<number | "ellipsis"> = []
  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index]
    const previous = sortedPages[index - 1]

    if (index > 0 && previous !== undefined && page - previous > 1) {
      result.push("ellipsis")
    }

    result.push(page)
  }

  return result
}

function formatYearSuffix(value: number) {
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`
  }

  const mod10 = value % 10
  if (mod10 === 1) {
    return `${value}st`
  }
  if (mod10 === 2) {
    return `${value}nd`
  }
  if (mod10 === 3) {
    return `${value}rd`
  }

  return `${value}th`
}
