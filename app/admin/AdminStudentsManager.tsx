"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useEffect, useMemo, useRef, useState } from "react"

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
  status: "PRESENT" | "ABSENT"
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

type StudentFilters = {
  q: string
  department: string
  year: string
  isActive: string
}

type LogFilters = {
  studentId?: string
}

export default function AdminStudentsManager() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const [q, setQ] = useState("")
  const [department, setDepartment] = useState("all")
  const [year, setYear] = useState("all")
  const [isActive, setIsActive] = useState("all")

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
  const [hasLoadedLogs, setHasLoadedLogs] = useState(false)

  const studentsRequestRef = useRef(0)
  const logsRequestRef = useRef(0)

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

  const fetchLogs = async (filters?: LogFilters) => {
    const requestId = ++logsRequestRef.current
    setLogsLoading(true)

    try {
      const url = new URL("/api/admin/students/attendance", window.location.origin)
      const chosenStudentId = filters?.studentId ?? selectedStudentId
      if (chosenStudentId) {
        url.searchParams.set("studentId", chosenStudentId)
      }

      const res = await fetch(url.toString())
      const data = (await res.json()) as {
        logs?: AttendanceLog[]
        error?: string
      }

      if (!res.ok) {
        if (requestId === logsRequestRef.current) {
          setLogs([])
        }
        return
      }

      if (requestId === logsRequestRef.current) {
        setLogs(data.logs ?? [])
      }
    } catch {
      if (requestId === logsRequestRef.current) {
        setLogs([])
      }
    } finally {
      if (requestId === logsRequestRef.current) {
        setLogsLoading(false)
        setHasLoadedLogs(true)
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStudents({ q, department, year, isActive })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [q, department, year, isActive])

  useEffect(() => {
    void fetchLogs({ studentId: selectedStudentId || undefined })
  }, [selectedStudentId])

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
      <Card className="border-slate-200 bg-linear-to-b from-white to-slate-50/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Roster
              </p>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                All Students
              </CardTitle>
            </div>
            <Button
              type="button"
              onClick={() => setPromoteOpen(true)}
              className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-[0_10px_20px_-6px_rgba(37,99,235,0.55)] transition hover:brightness-105"
            >
              Promote Batch
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4 lg:grid-cols-5">
              <Input
                placeholder="Search by name, email, roll"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="border-slate-200 bg-white/85 text-slate-800 placeholder:text-slate-500 focus-visible:ring-blue-400 lg:col-span-2"
              />

              <div className="relative">
                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-9 w-full appearance-none rounded-4xl border border-slate-200 bg-white/85 px-3 pr-10 text-sm text-slate-800 outline-none transition focus-visible:border-blue-400 focus-visible:ring-[3px] focus-visible:ring-blue-200"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="h-9 w-full appearance-none rounded-4xl border border-slate-200 bg-white/85 px-3 pr-10 text-sm text-slate-800 outline-none transition focus-visible:border-blue-400 focus-visible:ring-[3px] focus-visible:ring-blue-200"
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="relative">
                <select
                  value={isActive}
                  onChange={(event) => setIsActive(event.target.value)}
                  className="h-9 w-full appearance-none rounded-4xl border border-slate-200 bg-white/85 px-3 pr-10 text-sm text-slate-800 outline-none transition focus-visible:border-blue-400 focus-visible:ring-[3px] focus-visible:ring-blue-200"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="flex min-h-7 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md cursor-pointer border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setQ("")
                  setDepartment("all")
                  setYear("all")
                  setIsActive("all")
                  setSelectedStudentId("")
                }}
              >
                Clear all filters
              </Button>
              <p className="text-xs font-medium tracking-wide text-slate-500">
                {loading && hasLoadedStudents
                  ? "Updating results..."
                  : `Showing ${students.length} students (${activeCount} active)`}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                <TableHead className="font-semibold text-slate-700">Email</TableHead>
                <TableHead className="font-semibold text-slate-700">Department</TableHead>
                <TableHead className="font-semibold text-slate-700">Year</TableHead>
                <TableHead className="font-semibold text-slate-700">Roll</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`students-loading-${index}`}>
                    <TableCell>
                      <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto h-8 w-36 animate-pulse rounded-full bg-slate-200/80" />
                    </TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-blue-50/35">
                    <TableCell className="font-medium text-slate-900">{student.fullName}</TableCell>
                    <TableCell className="text-slate-700">{student.email ?? "-"}</TableCell>
                    <TableCell className="text-slate-700">{student.department}</TableCell>
                    <TableCell className="text-slate-700">Year {student.year}</TableCell>
                    <TableCell className="text-slate-700">{student.rollNo}</TableCell>
                    <TableCell>
                      <span
                        className={
                          student.isActive
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        }
                      >
                        {student.isActive ? "Active" : "Restricted"}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentId(student.id)
                        }}
                        disabled={actionLoading}
                      >
                        Logs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void updateStudent(student.id, !student.isActive)}
                        disabled={actionLoading}
                      >
                        {student.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(student)}
                        disabled={actionLoading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex min-h-7 flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {selectedStudentId
                ? "Showing logs for selected student (latest first)."
                : "Showing all students attendance logs (latest first)."}
            </p>
            {selectedStudentId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudentId("")}
                className="h-7"
              >
                Show All Logs
              </Button>
            ) : null}
          </div>

          <div className="min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`logs-loading-${index}`}>
                      <TableCell>
                        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-14 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-14 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{formatTime(log.createdAt)}</TableCell>
                      <TableCell>{log.student.fullName}</TableCell>
                      <TableCell>{log.student.rollNo}</TableCell>
                      <TableCell>{log.student.year}</TableCell>
                      <TableCell>{log.student.department}</TableCell>
                      <TableCell>{log.session.teacherName}</TableCell>
                      <TableCell>{log.session.subject}</TableCell>
                      <TableCell>
                        {log.status === "PRESENT" ? (
                          <span className="text-emerald-600">Present</span>
                        ) : (
                          <span className="text-rose-600">Absent</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Batch</DialogTitle>
            <DialogDescription>
              Admin-only action. Promote one batch to the next year in one click.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3">
            <select
              value={bulkDepartment}
              onChange={(event) => setBulkDepartment(event.target.value)}
              className="h-9 rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={sourceYear}
                onChange={(event) => setSourceYear(event.target.value)}
                className="h-9 rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="1">From 1st Year</option>
                <option value="2">From 2nd Year</option>
                <option value="3">From 3rd Year</option>
              </select>

              <select
                value={targetYear}
                onChange={(event) => setTargetYear(event.target.value)}
                className="h-9 rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="1">To 1st Year</option>
                <option value="2">To 2nd Year</option>
                <option value="3">To 3rd Year</option>
              </select>
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
              className="bg-linear-to-b from-[#6b68ff] to-[#0c29ba] text-white hover:brightness-105"
            >
              {bulkLoading ? "Promoting..." : "Promote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Danger Zone: Delete Student</DialogTitle>
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
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteStudent()}
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
