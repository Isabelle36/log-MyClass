"use client"

import { AnimatedBanner } from "@/components/ui/animated-banner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Status = "GOOD" | "WARNING" | "CRITICAL"

type DashboardData = {
  student: {
    id: string
    fullName: string
    email: string | null
    department: string
    year: number
    rollNo: number
    isActive: boolean
  }
  summary: {
    attendancePercentage: number
    totalAttended: number
    totalSessions: number
    status: Status
    actionPlan: string
    neededForOverall75: number
  }
  warning: {
    atRiskCount: number
    atRiskSubjects: Array<{
      subject: string
      present: number
      total: number
      percentage: number
      status: Status
      neededToRecover: number
    }>
  }
  today: Array<{
    sessionId: string
    subject: string
    date: string
    status: "PRESENT" | "NOT_MARKED"
  }>
  subjects: Array<{
    subject: string
    present: number
    total: number
    percentage: number
    status: Status
    neededToRecover: number
  }>
  history: Array<{
    sessionId: string
    subject: string
    date: string
    status: "PRESENT" | "ABSENT"
    markedAt: string | null
  }>
  predictions: {
    attendNextFour: number
    attendToRecover: number
    missNextTwo: number
    neededForOverall75: number
  } | null
  isDeactivated?: boolean
  error?: string
}

export function StudentDashboardClient() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/dashboard")
        const result = (await res.json()) as DashboardData

        if (!res.ok) {
          setData(result)
          return
        }

        setData(result)
      } catch {
        setData({ error: "Failed to load dashboard" } as DashboardData)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!data || data.error) {
    return <p className="text-sm text-red-600">{data?.error ?? "Failed to load dashboard"}</p>
  }

  const { student, summary, warning, subjects, history } = data

  const subjectActionText = (subject: DashboardData["subjects"][number]) => {
    if (subject.percentage >= 75) {
      return "On track"
    }

    if (subject.neededToRecover <= 0) {
      return "Stay consistent"
    }

    const suffix = subject.neededToRecover === 1 ? "class" : "classes"
    return `Need ${subject.neededToRecover} more ${suffix}`
  }

  const statusIcon = (status: Status) => {
    if (status === "GOOD") {
      return <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="h-4 w-4 text-emerald-600" />
    }

    if (status === "WARNING") {
      return <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="h-4 w-4 text-amber-600" />
    }

    return <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="h-4 w-4 text-rose-600" />
  }

  return (
    <div className="space-y-5 bg-[#f8fafc] p-1">
      {data.isDeactivated && (
        <AnimatedBanner
          variant="default"
          title="Attendance Access Restricted"
          description="Your account is currently restricted. You cannot make attendance until your dean or coordinator reactivates your account. Please contact them for assistance."
        />
      )}

      <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-slate-950 via-blue-900 to-cyan-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_35%),radial-gradient(circle_at_80%_0%,white_0%,transparent_30%)]" />
        <div className="relative space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-100">Student Portal</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome, {student.fullName}</h1>
            <p className="mt-2 text-sm text-cyan-100">
              {student.department} • Year {student.year} • Roll {student.rollNo}
            </p>
          </div>

          <Card className="border-white/25 bg-white/95 text-slate-900">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Your Attendance</p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-5xl font-bold tracking-tight">{summary.attendancePercentage}%</p>
                  {statusIcon(summary.status)}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {summary.totalAttended} of {summary.totalSessions} classes attended
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{summary.actionPlan}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => router.push("/scan")}
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  disabled={data.isDeactivated}
                >
                  Scan Attendance
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.today.length > 0 ? (
            <div className="rounded-xl bg-white/15 px-3 py-2 text-sm text-cyan-50">
              Today: {data.today[0].subject} - {data.today[0].status === "PRESENT" ? "Present ✅" : "Not marked"}
            </div>
          ) : null}
        </div>
      </section>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">Attention Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900">
          {warning.atRiskCount > 0 ? (
            <p>You are below 75% in {warning.atRiskCount} subjects.</p>
          ) : (
            <p>Great job. You are safe in all subjects right now.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects available yet.</p>
          ) : (
            subjects.map((subject) => (
              <div key={subject.subject} className="rounded-xl border bg-white p-3">
                {(() => {
                  const missed = Math.max(0, subject.total - subject.present)
                  return (
                    <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    {statusIcon(subject.status)}
                    <span>{subject.subject}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{subject.percentage}%</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {subject.present} attended • {missed} missed • {subject.present} / {subject.total}
                </p>
                <p className="mt-2 text-sm text-slate-700">{subjectActionText(subject)}</p>
                    </>
                  )
                })()}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No attendance history yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => (
                  <TableRow key={entry.sessionId}>
                    <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                    <TableCell>{entry.subject}</TableCell>
                    <TableCell>
                      {entry.status === "PRESENT" ? (
                        <span className="font-medium text-emerald-600">Present</span>
                      ) : (
                        <span className="font-medium text-rose-600">Absent</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
