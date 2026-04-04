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
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Search } from "lucide-react"

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
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-[10px]">
            <label className="flex h-[43px] w-[320px] items-center gap-[9px] rounded-[10px] border-[0.4px] border-[#afafaf] bg-[#f9f9f9] px-[9px] py-[3px]">
              <Search className="h-5 w-5 text-[#606060]" strokeWidth={1.8} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, roll no"
                aria-label="Search students"
                disabled={loading}
                className="w-full bg-transparent text-[14px] tracking-[-0.2px] text-[#3a3a3a] outline-none placeholder:text-[#8a8a8a]"
              />
            </label>

            <div className="h-[40px] min-w-[182px] shrink-0">
              <DropdownSelect
                value={department}
                onValueChange={setDepartment}
                disabled={loading}
                options={[
                  { value: "all", label: "All Departments" },
                  ...DEPARTMENTS.map((option) => ({ value: option, label: option })),
                ]}
                triggerClassName="h-full min-w-[182px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white px-3 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                chevronClassName="h-[15px] w-[15px] text-[#767676]"
                ariaLabel="Filter by department"
              />
            </div>

            <div className="h-[40px] min-w-[138px] shrink-0">
              <DropdownSelect
                value={year}
                onValueChange={setYear}
                disabled={loading}
                options={[
                  { value: "all", label: "All Years" },
                  { value: "1", label: "Year 1" },
                  { value: "2", label: "Year 2" },
                  { value: "3", label: "Year 3" },
                ]}
                triggerClassName="h-full min-w-[138px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white px-3 text-[14px] tracking-[-0.28px] text-[#3d3d3d]"
                chevronClassName="h-[15px] w-[15px] text-[#767676]"
                ariaLabel="Filter by year"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[10px]">
          <Button
            type="button"
            onClick={fetchStudents}
            disabled={loading}
            className="h-[43px] rounded-[10px] border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-4 text-[14px] font-semibold text-white"
          >
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
            className="h-[43px] rounded-[10px] border-[0.5px] border-[#c0c0c0] bg-white px-4 text-[14px] font-medium text-[#2f2f2f]"
          >
            Email Below 75%
          </Button>
        </div>
      </div>

      {subtitle ? <p className="text-[13px] tracking-[-0.26px] text-[#6d6d6d]">Showing {subtitle}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-y-[9px]">
          <thead>
            <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
              <th className="px-3 py-1">Name</th>
              <th className="px-3 py-1">Email</th>
              <th className="px-3 py-1">Year</th>
              <th className="px-3 py-1">Roll No</th>
              <th className="px-3 py-1">Status</th>
            </tr>
          </thead>
          <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`teacher-students-loading-${index}`}>
                  <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-44 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                  <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-8 text-center text-[14px] text-[#737373]"
                >
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] font-medium text-[#1f1f1f]">
                    {student.fullName}
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.email ?? "-"}</td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.year}</td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{student.rollNo}</td>
                  <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    {student.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent className="max-w-[560px] rounded-[28px] border border-[#d9d9d9] bg-white p-7 shadow-none ring-0">
          <DialogHeader>
            <DialogTitle className="text-[34px] font-semibold tracking-[-0.8px] text-[#17181b] md:text-[30px]">
              Email Below 75% Warning
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-[1.35] tracking-[-0.2px] text-[#6f6f6f]">
              Select department and year to identify and email students below 75% attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DropdownSelect
              value={warningDepartment}
              onValueChange={setWarningDepartment}
              options={DEPARTMENTS.map((option) => ({ value: option, label: option }))}
              triggerClassName="h-[44px] rounded-full border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-4 text-[15px] tracking-[-0.2px] text-[#2f2f2f]"
              chevronClassName="h-[15px] w-[15px] text-[#767676]"
              ariaLabel="Warning department"
            />

            <DropdownSelect
              value={warningYear}
              onValueChange={setWarningYear}
              options={[
                { value: "1", label: "1st Year" },
                { value: "2", label: "2nd Year" },
                { value: "3", label: "3rd Year" },
              ]}
              triggerClassName="h-[44px] rounded-full border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-4 text-[15px] tracking-[-0.2px] text-[#2f2f2f]"
              chevronClassName="h-[15px] w-[15px] text-[#767676]"
              ariaLabel="Warning year"
            />
          </div>

          {warningResult ? (
            <div className="rounded-[12px] border border-[#d6dce3] bg-[#f8fafc] p-3 text-[12px] tracking-[-0.12px] text-[#4b5563]">
              {warningResult.totalStudents === 0 ? (
                <p className="text-[#687384]">
                  No students found in {warningResult.department} Year {warningResult.year}.
                </p>
              ) : warningResult.atRiskCount === 0 ? (
                <p className="text-[#687384]">
                  No students below 75% in {warningResult.department} Year {warningResult.year}.
                </p>
              ) : (
                <>
                  <p>
                    {warningResult.department} Year {warningResult.year}: {warningResult.atRiskCount} below 75%
                    ({warningResult.recipientCount} with email)
                  </p>
                  <p className="mt-1 text-[#7a8595]">
                    Based on {warningResult.totalSessions} sessions for {warningResult.totalStudents} active students.
                  </p>

                  {warningResult.atRiskStudents.length > 0 ? (
                    <div className="mt-3 max-h-36 overflow-auto rounded-[10px] border border-[#d8dee8] bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#f0f4f8]">
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

          <DialogFooter className="flex-wrap gap-2 sm:justify-start">
            <Button
              variant="outline"
              onClick={() => setWarningOpen(false)}
              className="h-[42px] rounded-full border-[0.5px] border-[#c8c8c8] bg-[#f2f2f2] px-5 text-[14px] font-medium text-[#2c2c2c]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={downloadCSV}
              disabled={warningLoading || !warningResult || warningResult.atRiskStudents.length === 0}
              className="h-[42px] rounded-full border-[0.5px] border-[#d0d0d0] bg-[#f5f5f5] px-5 text-[14px] font-medium text-[#6a6a6a] disabled:opacity-70"
            >
              Download CSV
            </Button>
            <Button
              type="button"
              onClick={() => void prepareLowAttendanceWarnings()}
              disabled={warningLoading}
              className="h-[42px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-5 text-[14px] font-semibold tracking-[-0.2px] text-white hover:brightness-105"
            >
              {warningLoading ? "Finding..." : "Find Below 75%"}
            </Button>
            <Button
              type="button"
              onClick={() => void sendWarningEmail()}
              disabled={warningSending || !warningResult || warningResult.atRiskStudents.length === 0}
              className="h-[42px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-5 text-[14px] font-semibold tracking-[-0.2px] text-white hover:brightness-105 disabled:opacity-60"
            >
              {warningSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
