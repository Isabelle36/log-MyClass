"use client"

import { Button } from "@/components/ui/button"
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
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { X } from "lucide-react"

const DEPARTMENTS = ["BBA", "BCA"]

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

type StudentsResponse = {
  count: number
  department: string
  students: StudentRow[]
  error?: string
}

type AtRiskStudent = {
  id: string
  fullName: string
  email: string | null
  rollNo: number
  attendancePercentage: number
  present: number
  totalConsidered: number
}

type AtRiskResponse = {
  department: string
  year: number
  threshold: number
  totalStudents: number
  totalSessions: number
  atRiskCount: number
  recipientCount: number
  atRiskStudents: AtRiskStudent[]
  mailtoUrl: string | null
  error?: string
}

export default function TeacherStudentsTable() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [departmentLabel, setDepartmentLabel] = useState("")
  const [department, setDepartment] = useState("all")
  const [query, setQuery] = useState("")
  const [year, setYear] = useState("all")
  const [loading, setLoading] = useState(false)
  const [warningOpen, setWarningOpen] = useState(false)
  const [warningDepartment, setWarningDepartment] = useState("BCA")
  const [warningYear, setWarningYear] = useState("1")
  const [warningLoading, setWarningLoading] = useState(false)
  const [warningSending, setWarningSending] = useState(false)
  const [warningResult, setWarningResult] = useState<AtRiskResponse | null>(null)

  const fetchStudents = async () => {
    setLoading(true)

    const url = new URL("/api/teacher/students", window.location.origin)
    if (department.trim()) {
      url.searchParams.set("department", department.trim())
    }
    if (query.trim()) {
      url.searchParams.set("q", query.trim())
    }
    if (year.trim() && year !== "all") {
      url.searchParams.set("year", year.trim())
    }

    const res = await fetch(url.toString(), { method: "GET" })
    const data = (await res.json()) as StudentsResponse

    if (!res.ok) {
      setStudents([])
      toast.error(data.error ?? "Failed to fetch students")
      setLoading(false)
      return
    }

    setStudents(data.students)
    setDepartmentLabel(data.department)

    if (data.department && DEPARTMENTS.includes(data.department) && warningDepartment !== data.department) {
      setWarningDepartment(data.department)
    }

    setLoading(false)
  }

  useEffect(() => {
    void fetchStudents()
  }, [department])

  const prepareLowAttendanceWarnings = async () => {
    if (!warningDepartment || !warningYear) {
      toast.error("Please choose department and year")
      return
    }

    setWarningLoading(true)

    try {
      const res = await fetch("/api/teacher/students/at-risk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: warningDepartment,
          year: Number(warningYear),
          threshold: 75,
        }),
      })

      const data = (await res.json()) as AtRiskResponse
      setWarningResult(data)

      if (!res.ok) {
        toast.error(data.error ?? "Failed to build warning email list")
        return
      }

      if (data.totalStudents === 0) {
        toast.info(`No students found in ${data.department} Year ${data.year}`)
        return
      }

      if (data.atRiskCount === 0) {
        toast.info(`No students below 75% in ${data.department} Year ${data.year}`)
        return
      }

      toast.success(`Found ${data.atRiskCount} students below 75%`) 
    } catch {
      toast.error("Failed to build warning email list")
    } finally {
      setWarningLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!warningResult || warningResult.atRiskStudents.length === 0) {
      toast.error("No students to download")
      return
    }

    const headers = ["Student Name", "Roll No", "Email", "Attendance %"]
    const rows = warningResult.atRiskStudents.map((student) => [
      student.fullName,
      student.rollNo.toString(),
      student.email || "",
      `${student.attendancePercentage}%`,
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell)
            return cellStr.includes(",") || cellStr.includes('"') ? `"${cellStr.replace(/"/g, '""')}"` : cellStr
          })
          .join(",")
      )
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `below-75-${warningDepartment}-year${warningYear}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("CSV downloaded!")
  }

  const sendWarningEmail = async () => {
    if (!warningResult || warningResult.atRiskStudents.length === 0) {
      toast.error("No students to email")
      return
    }

    setWarningSending(true)

    try {
      const res = await fetch("/api/teacher/students/send-attendance-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: warningDepartment,
          year: Number(warningYear),
          atRiskStudents: warningResult.atRiskStudents,
        }),
      })

      const data = (await res.json()) as { sent?: number; failed?: number; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send emails")
        return
      }

      toast.success(`Sent ${data.sent ?? 0} warning emails`)
      setWarningOpen(false)
      setWarningResult(null)
    } catch {
      toast.error("Failed to send emails")
    } finally {
      setWarningSending(false)
    }
  }

  const subtitle = useMemo(() => {
    if (!departmentLabel) {
      return ""
    }
    return `${departmentLabel} department`
  }, [departmentLabel])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative sm:max-w-40">
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            disabled={loading}
            className="h-9 w-full appearance-none rounded-4xl border border-input bg-background px-3 pr-10 text-sm"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Input
          placeholder="Search name, email, roll no"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={loading}
        />
        <div className="relative sm:max-w-28">
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            disabled={loading}
            className="h-9 w-full appearance-none rounded-4xl border border-input bg-background px-3 pr-10 text-sm"
          >
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <Button type="button" onClick={fetchStudents} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setWarningResult(null)
            setWarningOpen(true)
          }}
          disabled={loading}
        >
          Email Below 75%
        </Button>
      </div>

      {subtitle ? <p className="text-xs text-muted-foreground">Showing {subtitle}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Roll No</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No students found.
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.fullName}</TableCell>
                <TableCell>{student.email ?? "-"}</TableCell>
                <TableCell>{student.year}</TableCell>
                <TableCell>{student.rollNo}</TableCell>
                <TableCell>{student.isActive ? "Active" : "Inactive"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Below 75% Warning</DialogTitle>
            <button
              type="button"
              onClick={() => setWarningOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <DialogDescription>
              Select department and year to identify and email students below 75% attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <select
                value={warningDepartment}
                onChange={(event) => setWarningDepartment(event.target.value)}
                className="h-9 w-full appearance-none rounded-4xl border border-input bg-background px-3 pr-10 text-sm"
              >
                {DEPARTMENTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="relative">
              <select
                value={warningYear}
                onChange={(event) => setWarningYear(event.target.value)}
                className="h-9 w-full appearance-none rounded-4xl border border-input bg-background px-3 pr-10 text-sm"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {warningResult ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {warningResult.totalStudents === 0 ? (
                <p className="text-slate-600">
                  No students found in {warningResult.department} Year {warningResult.year}.
                </p>
              ) : warningResult.atRiskCount === 0 ? (
                <p className="text-slate-600">
                  No students below 75% in {warningResult.department} Year {warningResult.year}.
                </p>
              ) : (
                <>
                  <p>
                    {warningResult.department} Year {warningResult.year}: {warningResult.atRiskCount} below 75%
                    ({warningResult.recipientCount} with email)
                  </p>
                  <p className="mt-1 text-slate-500">
                    Based on {warningResult.totalSessions} sessions for {warningResult.totalStudents} active students.
                  </p>

                  {warningResult.atRiskStudents.length > 0 ? (
                    <div className="mt-3 max-h-36 overflow-auto rounded border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100">
                          <tr>
                            <th className="px-2 py-1 font-medium">Student</th>
                            <th className="px-2 py-1 font-medium">Roll</th>
                            <th className="px-2 py-1 font-medium">Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {warningResult.atRiskStudents.map((student) => (
                            <tr key={student.id}>
                              <td className="px-2 py-1">{student.fullName}</td>
                              <td className="px-2 py-1">{student.rollNo}</td>
                              <td className="px-2 py-1">{student.attendancePercentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadCSV}
              disabled={warningLoading || !warningResult || warningResult.atRiskStudents.length === 0}
            >
              Download CSV
            </Button>
            <Button
              type="button"
              onClick={() => void prepareLowAttendanceWarnings()}
              disabled={warningLoading}
            >
              {warningLoading ? "Finding..." : "Find Below 75%"}
            </Button>
            <Button
              type="button"
              onClick={() => void sendWarningEmail()}
              disabled={warningSending || !warningResult || warningResult.atRiskStudents.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {warningSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
