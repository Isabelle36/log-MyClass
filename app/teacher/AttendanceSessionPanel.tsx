"use client"

import { Button } from "@/components/ui/button"
import { getSubjectsForDepartmentYear } from "@/lib/curriculum"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react"

type SessionData = {
  id: string
  subject: string
  department: string
  year: number
  expiresAt: string
  createdAt: string
}

type SessionCreateResponse = {
  session?: SessionData
  scanUrl?: string
  totalStudents?: number
  error?: string
}

type SummaryAttendee = {
  id: string
  createdAt: string
  student: {
    fullName: string
    rollNo: number
    email: string | null
  }
}

type SummaryResponse = {
  session: SessionData
  presentCount: number
  totalStudents: number
  attendees: SummaryAttendee[]
  isExpired: boolean
  error?: string
}

const YEARS = ["1", "2", "3"]
const DEPARTMENTS = ["BCA", "BBA"]

export default function AttendanceSessionPanel() {
  const [department, setDepartment] = useState("BCA")
  const [subject, setSubject] = useState("")
  const [year, setYear] = useState("1")
  const [durationSeconds, setDurationSeconds] = useState("60")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const [session, setSession] = useState<SessionData | null>(null)
  const [scanUrl, setScanUrl] = useState("")
  const [attendees, setAttendees] = useState<SummaryAttendee[]>([])
  const [presentCount, setPresentCount] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [isExpired, setIsExpired] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const subjectOptions = useMemo(() => {
    return getSubjectsForDepartmentYear(department, Number(year))
  }, [department, year])

  useEffect(() => {
    if (!subjectOptions.includes(subject)) {
      setSubject(subjectOptions[0] ?? "")
    }
  }, [subjectOptions, subject])

  const qrImageUrl = useMemo(() => {
    if (!scanUrl) {
      return ""
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(scanUrl)}`
  }, [scanUrl])

  const syncSummary = async (sessionId: string) => {
    const res = await fetch(`/api/teacher/attendance/summary?sessionId=${encodeURIComponent(sessionId)}`)
    const data = (await res.json()) as SummaryResponse

    if (!res.ok) {
      setError(data.error ?? "Failed to load attendance summary")
      return
    }

    setAttendees(data.attendees)
    setPresentCount(data.presentCount)
    setTotalStudents(data.totalStudents)
    setIsExpired(data.isExpired)
  }

  const createSession = async () => {
    if (!subject || !year || !durationSeconds) {
      return
    }

    setCreating(true)
    setError("")

    const res = await fetch("/api/teacher/attendance/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        department,
        year: Number(year),
        durationSeconds: Number(durationSeconds),
      }),
    })

    const data = (await res.json()) as SessionCreateResponse

    if (!res.ok || !data.session || !data.scanUrl) {
      setCreating(false)
      setError(data.error ?? "Failed to create session")
      return
    }

    setSession(data.session)
    setScanUrl(data.scanUrl)
    setAttendees([])
    setPresentCount(0)
    setTotalStudents(data.totalStudents ?? 0)
    setIsExpired(false)
    setCreating(false)

    await syncSummary(data.session.id)
  }

  useEffect(() => {
    if (!session) {
      return
    }

    const timer = window.setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff === 0) {
        setIsExpired(true)
      }
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    const poller = window.setInterval(() => {
      void syncSummary(session.id)
    }, 3000)

    return () => {
      window.clearInterval(poller)
    }
  }, [session])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        <div>
          <label className="text-xs font-medium">Class</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            disabled={creating}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={creating || subjectOptions.length === 0}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            {subjectOptions.length === 0 ? (
              <option value="">No subjects configured</option>
            ) : (
              subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={creating}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Duration (sec)"
          inputMode="numeric"
          value={durationSeconds}
          onChange={(event) => setDurationSeconds(event.target.value)}
          disabled={creating}
        />
        <Button type="button" onClick={createSession} disabled={creating} className="mt-6">
          {creating ? "Starting..." : "Start"}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {session ? (
        <div className="space-y-4 rounded-2xl border p-4">
          <div className="flex flex-col gap-1 text-sm">
            <p>
              Session: <strong>{session.subject}</strong> | {session.department} | Year {session.year}
            </p>
            <p>
              Status: {isExpired ? "Expired" : "Active"} ({secondsLeft}s left)
            </p>
            <p>
              Present: {presentCount} / {totalStudents}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2">
            {qrImageUrl ? <img src={qrImageUrl} alt="Attendance session QR" className="rounded-xl border" /> : null}
            <p className="text-xs text-muted-foreground break-all">{scanUrl}</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Marked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No attendance yet.
                  </TableCell>
                </TableRow>
              ) : (
                attendees.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.student.fullName}</TableCell>
                    <TableCell>{entry.student.rollNo}</TableCell>
                    <TableCell>{entry.student.email ?? "-"}</TableCell>
                    <TableCell>{new Date(entry.createdAt).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
