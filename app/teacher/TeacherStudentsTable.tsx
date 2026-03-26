"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"

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

export default function TeacherStudentsTable() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [department, setDepartment] = useState("")
  const [query, setQuery] = useState("")
  const [year, setYear] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchStudents = async () => {
    setLoading(true)
    setError("")

    const url = new URL("/api/teacher/students", window.location.origin)
    if (query.trim()) {
      url.searchParams.set("q", query.trim())
    }
    if (year.trim()) {
      url.searchParams.set("year", year.trim())
    }

    const res = await fetch(url.toString(), { method: "GET" })
    const data = (await res.json()) as StudentsResponse

    if (!res.ok) {
      setStudents([])
      setError(data.error ?? "Failed to fetch students")
      setLoading(false)
      return
    }

    setStudents(data.students)
    setDepartment(data.department)
    setLoading(false)
  }

  useEffect(() => {
    void fetchStudents()
  }, [])

  const subtitle = useMemo(() => {
    if (!department) {
      return ""
    }
    return `${department} department`
  }, [department])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search name, email, roll no"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={loading}
        />
        <Input
          placeholder="Year"
          inputMode="numeric"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          disabled={loading}
          className="sm:max-w-28"
        />
        <Button type="button" onClick={fetchStudents} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {subtitle ? <p className="text-xs text-muted-foreground">Showing {subtitle}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
    </div>
  )
}
