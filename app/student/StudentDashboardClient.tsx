"use client"

import { Button } from "@/components/ui/button"
import { Banner } from "../../components/ui/banner"
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  History,
  QrCode,
  Target,
  TriangleAlert,
  Info,
  AlertCircle,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
    totalScheduledSessions?: number
    totalExcused?: number
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
    status: "PRESENT" | "ABSENT" | "EXCUSED"
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
          toast.error(result.error ?? "Failed to load dashboard")
          setData(result)
          return
        }

        setData(result)
      } catch {
        toast.error("Failed to load dashboard")
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
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{data?.error ?? "Failed to load dashboard"}</p>
      </div>
    )
  }

  const { student, summary, warning, subjects, history } = data
  const totalExcused = summary.totalExcused ?? 0
  const totalAbsent = Math.max(0, summary.totalSessions - summary.totalAttended - totalExcused)

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

  const statusIcon = (status: Status, className = "h-4 w-4") => {
    if (status === "GOOD") {
      return <CheckCircle2 className={`${className} text-green-500`} />
    }

    if (status === "WARNING") {
      return <AlertTriangle className={`${className} text-yellow-500`} />
    }

    return <AlertCircle className={`${className} text-red-500`} />
  }

  const statusTextClass = (status: Status) => {
    if (status === "GOOD") return "text-green-500"
    if (status === "WARNING") return "text-yellow-500"
    return "text-red-500"
  }

  const primaryButtonClass =
    "h-[40px] w-auto shrink-0 justify-center rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-4 text-[13px] font-semibold tracking-[-0.15px] text-white sm:h-[44px] sm:px-5 sm:text-[15px]"

  return (
    <div className={data.isDeactivated ? "space-y-6 pt-14 md:pt-16" : "space-y-6"}>
      {data.isDeactivated && (
        <Banner
          layout="complex"
          rounded="none"
          className="fixed inset-x-0 top-0 z-[70] border-x-0 border-t-0 border-[#2f343f] bg-[linear-gradient(145deg,#101217_0%,#171b24_100%)] text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
          icon={<TriangleAlert className="h-5 w-5 text-yellow-500" />}
        >
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.3px] text-white md:text-[20px]">Attendance Access Restricted</h2>
            <p className="mt-0.5 text-[14px] leading-[1.5] tracking-[-0.1px] text-[#cfd6e3]">
              Your account is currently restricted. You cannot scan attendance until a dean or coordinator reactivates your account.
            </p>
          </div>
        </Banner>
      )}

      <section className="relative overflow-hidden rounded-[23px] border border-[#cecdcd] bg-[linear-gradient(145deg,#ffffff_0%,#f7faff_52%,#f0f6ff_100%)] p-4 md:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#9fd4ff]/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#8ea7ff]/25 blur-3xl" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-3 md:flex-row md:items-start md:gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f6f6f] md:text-[12px]">Student Dashboard</p>
            <h1
              className="mt-1 text-[34px] font-bold leading-[1.05] tracking-[-1px] text-[#17181b] md:text-[40px]"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Welcome, {student.fullName}
            </h1>
            <p className="mt-1 text-[14px] font-medium tracking-[-0.15px] text-[#555] md:text-[15px]">
              {student.department} | Year {student.year} | Roll {student.rollNo}
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-[2px] rounded-full bg-[linear-gradient(135deg,rgba(144,195,255,0.65),rgba(196,170,255,0.7),rgba(153,227,193,0.65))] blur-[1.5px]" />
              <div className="relative flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(168,168,168,0.25)] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] ring-1 ring-white/70 transition-transform duration-200 hover:scale-[1.03]">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-[40px] w-[40px]",
                      userButtonTrigger:
                        "h-[40px] w-[40px] rounded-full !bg-transparent hover:!bg-transparent focus:!bg-transparent active:!bg-transparent data-[state=open]:!bg-transparent",
                    },
                  }}
                />
              </div>
              <span className="pointer-events-none absolute bottom-[2px] right-[2px] h-[9px] w-[9px] rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <Button
              type="button"
              onClick={() => router.push("/scan")}
              className={primaryButtonClass}
              disabled={data.isDeactivated}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan Attendance
            </Button>
          </div>
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-[14px] border border-[#e6e6e6] bg-[#fafafa] p-4">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase leading-none tracking-[0.02em] text-[#5f5f5f]"><CalendarCheck2 className="h-4 w-4 shrink-0 text-[#525252]" />Overall Attendance</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[36px] font-semibold leading-none tracking-[-1.2px] text-[#151515] md:text-[42px]">{summary.attendancePercentage}%</p>
              {statusIcon(summary.status, "h-5 w-5")}
            </div>
            <p className="mt-1 text-[13px] leading-[1.45] tracking-[-0.1px] text-[#6a6a6a]">
              Present in {summary.totalAttended} of {summary.totalSessions} total classes.
            </p>
            {totalExcused > 0 ? (
              <p className="mt-0.5 text-[12px] leading-[1.4] tracking-[-0.1px] text-[#7b7b7b]">
                Includes {totalExcused} excused {totalExcused === 1 ? "class" : "classes"} in total count.
              </p>
            ) : null}
          </article>

          <article className="rounded-[14px] border border-[#e6e6e6] bg-[#fafafa] p-4">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase leading-none tracking-[0.02em] text-[#5f5f5f]"><BarChart3 className="h-4 w-4 shrink-0 text-[#525252]" />Sessions Summary</p>
            <p className="mt-2 text-[15px] leading-[1.35] tracking-[-0.15px] text-[#1d1d1d]">
              Total Classes: <span className="font-semibold">{summary.totalSessions}</span>
            </p>
            <p className="mt-1 text-[15px] leading-[1.35] tracking-[-0.15px] text-[#1d1d1d]">
              Present: <span className="font-semibold">{summary.totalAttended}</span>
            </p>
            {typeof summary.totalExcused === "number" ? (
              <p className="mt-1 text-[15px] leading-[1.35] tracking-[-0.15px] text-[#1d1d1d]">
                Excused (counted): <span className="font-semibold">{summary.totalExcused}</span>
              </p>
            ) : null}
            <p className="mt-1 text-[15px] leading-[1.35] tracking-[-0.15px] text-[#1d1d1d]">
              Absent: <span className="font-semibold">{totalAbsent}</span>
              </p>
          </article>

          <article className="rounded-[14px] border border-[#e6e6e6] bg-[#fafafa] p-4">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase leading-none tracking-[0.02em] text-[#5f5f5f]"><Target className="h-4 w-4 shrink-0 text-[#525252]" />Action Plan</p>
            <p className="mt-2 text-[14px] leading-[1.55] tracking-[-0.1px] text-[#202020]">{summary.actionPlan}</p>
          </article>
        </div>

        {data.today.length > 0 ? (
          <div className="relative z-10 mt-3 rounded-[12px] border border-[#dfe7ff] bg-[#edf3ff] px-3 py-2.5 text-[14px] tracking-[-0.15px] text-[#24406f]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-semibold">Today:</span>
              <span>{data.today[0].subject}</span>
              <span className="text-[#7f8fb1]">|</span>
            {data.today[0].status === "PRESENT" ? (
              <span className="inline-flex items-center gap-1 font-semibold leading-none text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Present
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold leading-none text-yellow-600">
                <Clock3 className="h-4 w-4" /> Not Marked
              </span>
            )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[23px] border border-[#cecdcd] bg-white p-4 md:p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert
            className={`mt-0.5 h-5 w-5 ${warning.atRiskCount > 0 ? (summary.status === "CRITICAL" ? "text-red-500" : "text-yellow-500") : "text-green-500"}`}
          />
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.6px] text-[#17181b] md:text-[24px]">{warning.atRiskCount > 0 ? "Attention Required" : "All Good"}</h2>
            <p className="mt-1 text-[14px] leading-[1.5] tracking-[-0.1px] text-[#555]">
              {warning.atRiskCount > 0
                ? `You are below 75% in ${warning.atRiskCount} ${warning.atRiskCount === 1 ? "subject" : "subjects"}.`
                : "Great job. You are safe in all subjects right now."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[23px] border border-[#cecdcd] bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#1f2329]" />
          <h2 className="text-[22px] font-semibold tracking-[-0.6px] text-[#17181b] md:text-[24px]">Your Subjects</h2>
        </div>
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects available yet.</p>
          ) : (
            subjects.map((subject) => (
              <div key={subject.subject} className="rounded-[12px] border border-[#e8e8e8] bg-[#fbfbfb] p-3.5">
                {(() => {
                  const missed = Math.max(0, subject.total - subject.present)
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.15px] text-[#17181b]">
                          {subject.status === "GOOD" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className={`h-4 w-4 ${statusTextClass(subject.status)}`} />
                          )}
                          <span>{subject.subject}</span>
                        </div>
                        <p className={`text-[15px] font-semibold tracking-[-0.15px] ${statusTextClass(subject.status)}`}>{subject.percentage}%</p>
                      </div>
                      <p className="mt-1 text-[13px] leading-[1.4] tracking-[-0.1px] text-[#666]">
                        {subject.present} attended | {missed} missed | {subject.present}/{subject.total}
                      </p>
                      <p className="mt-2 text-[14px] font-medium tracking-[-0.1px] text-[#2d2d2d]">{subjectActionText(subject)}</p>
                    </>
                  )
                })()}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[23px] border border-[#cecdcd] bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-5 w-5 text-[#1f2329]" />
          <h2 className="text-[22px] font-semibold tracking-[-0.6px] text-[#17181b] md:text-[24px]">Attendance History</h2>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-[8px]">
            <thead>
              <tr className="sticky top-0 z-10 bg-white text-left text-[14px] font-semibold tracking-[-0.2px] text-black md:text-[15px]">
                <th className="px-4 py-1">Date</th>
                <th className="px-4 py-1">Time</th>
                <th className="px-4 py-1">Subject</th>
                <th className="px-4 py-1">Status</th>
              </tr>
            </thead>
            <tbody className="text-[13px] tracking-[-0.1px] text-[#2a2a2a] md:text-[14px]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-4 py-[14px] text-center text-[13px] text-[#6f6f6f]">
                    No attendance history yet.
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={`${entry.sessionId}-${entry.date}`}>
                    <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{formatDateOnly(entry.date)}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-[#3b3b3b]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTimeOnly(entry.date)}
                      </span>
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{entry.subject}</td>
                    <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">
                      {entry.status === "PRESENT" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </span>
                      ) : entry.status === "EXCUSED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-semibold text-amber-700">
                          <Info className="h-3.5 w-3.5" /> Excused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[12px] font-semibold text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}

function formatDateOnly(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTimeOnly(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}
