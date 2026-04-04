"use client"

import { useEffect, useMemo, useState } from "react"
import { figmaAssets } from "./components/figmaAssets"

type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED"

type AttendanceLog = {
  id: string
  status: AttendanceStatus
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

type MetricsState = {
  totalStudents: number
  totalPresents: number
  totalAbsents: number
  totalLeave: number
  loading: boolean
  error?: string
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default function AdminDashboardOverview() {
  const [studentsCount, setStudentsCount] = useState(0)
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(undefined)

        const [studentsRes, logsRes] = await Promise.all([
          fetch("/api/admin/students", { cache: "no-store" }),
          fetch("/api/admin/students/attendance", { cache: "no-store" }),
        ])

        if (!studentsRes.ok || !logsRes.ok) {
          throw new Error("Failed to load metrics")
        }

        const studentsData = (await studentsRes.json()) as { count?: number }
        const logsData = (await logsRes.json()) as { logs?: AttendanceLog[] }

        if (cancelled) return

        setStudentsCount(typeof studentsData.count === "number" ? studentsData.count : 0)
        setLogs(Array.isArray(logsData.logs) ? logsData.logs : [])
      } catch {
        if (cancelled) return
        setError("Unable to load dashboard metrics right now.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const metrics = useMemo<MetricsState>(() => {
    const now = Date.now()
    const recentLogs = logs.filter((log) => {
      const stamp = new Date(log.createdAt).getTime()
      return Number.isFinite(stamp) && now - stamp <= THIRTY_DAYS_MS
    })

    let totalPresents = 0
    let totalAbsents = 0
    let totalLeave = 0

    for (const log of recentLogs) {
      if (log.status === "PRESENT") totalPresents += 1
      if (log.status === "ABSENT") totalAbsents += 1
      if (log.status === "EXCUSED") totalLeave += 1
    }

    return {
      totalStudents: studentsCount,
      totalPresents,
      totalAbsents,
      totalLeave,
      loading,
      error,
    }
  }, [studentsCount, logs, loading, error])

  const cards = [
    {
      title: "Total Students",
      value: formatCount(metrics.totalStudents, metrics.loading),
      trend: "23.6%",
      trendDirection: "up" as const,
      accent: "#32acfe",
      gradient: "linear-gradient(128.2806056398834deg, #aee0fe 7.5795%, #e3f7ff 77.556%)",
      flower: figmaAssets.cardFlowerBlue,
      flowerWrapClassName: "left-[116px] top-[-75px] h-[411.852px] w-[411.852px]",
      flowerClassName: "h-[294.606px] w-[294.606px] rotate-[53.69deg] opacity-[0.2]",
    },
    {
      title: "Total Presents",
      value: formatCount(metrics.totalPresents, metrics.loading),
      trend: "46.2%",
      trendDirection: "up" as const,
      accent: "#75f212",
      gradient: "linear-gradient(128.56118864789312deg, #c3fb96 27.446%, #e0fec7 66.048%)",
      flower: figmaAssets.cardFlowerGreen,
      flowerWrapClassName: "left-[82.65px] top-[-72.84px] h-[411.852px] w-[411.852px]",
      flowerClassName: "h-[294.606px] w-[294.606px] rotate-[53.69deg] opacity-[0.2]",
    },
    {
      title: "Total Absents",
      value: formatCount(metrics.totalAbsents, metrics.loading),
      trend: "12.0%",
      trendDirection: "down" as const,
      accent: "#ff4e8d",
      gradient: "linear-gradient(128.56118864789312deg, #fcb3ce 27.446%, #ffdae7 66.048%)",
      flower: figmaAssets.cardFlowerPink,
      flowerWrapClassName: "left-[116px] top-[-75px] h-[411.852px] w-[411.852px]",
      flowerClassName: "h-[294.606px] w-[294.606px] rotate-[53.69deg] opacity-[0.2]",
    },
    {
      title: "Total Leave",
      value: formatCount(metrics.totalLeave, metrics.loading, true),
      trend: "14.5%",
      trendDirection: "down" as const,
      accent: "#757dff",
      gradient: "linear-gradient(145.32739501685975deg, #b8bdff 0%, #e4e5ff 88.613%)",
      flower: figmaAssets.cardFlowerPurple,
      flowerWrapClassName: "left-[177px] top-[-7px] h-[290.449px] w-[290.449px]",
      flowerClassName: "h-[246.468px] w-[246.468px] rotate-[11.44deg] opacity-[0.2]",
    },
  ]

  const recentTableLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
  }, [logs])

  return (
    <section className="space-y-3">
      <div className="rounded-[33px] bg-[#f6f6f6] p-[12px]">
        <div className="grid grid-cols-1 gap-[19px] md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="relative h-[276px] w-full min-w-0 overflow-hidden rounded-[18px] shadow-[14px_14px_6px_0px_rgba(0,0,0,0),9px_9px_5px_0px_rgba(0,0,0,0),5px_5px_4px_0px_rgba(0,0,0,0.01),2px_2px_3px_0px_rgba(0,0,0,0.02),1px_1px_2px_0px_rgba(0,0,0,0.02)]"
              style={{ backgroundImage: card.gradient }}
            >
              <div className={`absolute flex items-center justify-center ${card.flowerWrapClassName}`}>
                <img src={card.flower} alt="" aria-hidden="true" className={card.flowerClassName} />
              </div>

              <div className="absolute inset-x-[20px] top-[24px] flex flex-col gap-[93px]">
                <div className="flex w-[204px] flex-col gap-[8px]">
                  <p className="text-[33px] font-semibold leading-none tracking-[-1.32px] text-[#323232]">
                    {card.title}
                  </p>
                  <div className="flex items-start gap-[3px] text-[10px] tracking-[-0.4px]">
                    <div className="flex items-start gap-[3px]">
                      <img
                        src={card.trendDirection === "up" ? figmaAssets.trendUp : figmaAssets.trendDown}
                        alt=""
                        aria-hidden="true"
                        className={card.trendDirection === "down" ? "h-[13px] w-[13px] -scale-y-100" : "h-[13px] w-[13px]"}
                      />
                      <span className={card.trendDirection === "up" ? "font-medium text-[#973cff]" : "font-medium text-[#f70e0e]"}>
                        {card.trend}
                      </span>
                    </div>
                    <span className="font-medium text-black">Last 30 days</span>
                  </div>
                </div>

                <div className="relative h-[60px]">
                  <div
                    className="absolute inset-y-0 left-0 w-[3px] rounded-[1px] shadow-[inset_-1px_0px_1.3px_0px_rgba(255,255,255,0.25)]"
                    style={{ backgroundColor: card.accent }}
                  />
                  <div className="ml-[2px] flex h-full min-w-0 items-center overflow-hidden bg-[linear-gradient(83.9916948455516deg,#fff_78.23%,rgba(255,255,255,0)_100%)] px-[6px]">
                    <p className="text-[50px] font-medium leading-none tracking-[-2px] text-black">{card.value}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="rounded-[23px] border border-[#cecdcd] bg-white p-[20px]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[20px] font-semibold tracking-[-0.6px] text-[#2d2d2d]">Attendance Logs</h2>
          <p className="text-[13px] tracking-[-0.26px] text-[#6d6d6d]">Latest activity from all classes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-y-[8px]">
            <thead>
              <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
                <th className="px-4 py-1">Date</th>
                <th className="px-4 py-1">Time</th>
                <th className="px-4 py-1">Student</th>
                <th className="px-4 py-1">Roll</th>
                <th className="px-4 py-1">Year</th>
                <th className="px-4 py-1">Class</th>
                <th className="px-4 py-1">Teacher</th>
                <th className="px-4 py-1">Subject</th>
                <th className="px-4 py-1">Status</th>
              </tr>
            </thead>
            <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
              {metrics.loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`dash-log-loading-${index}`}>
                    {Array.from({ length: 9 }).map((__, colIndex) => (
                      <td
                        key={`dash-log-loading-cell-${index}-${colIndex}`}
                        className={
                          colIndex === 0
                            ? "rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]"
                            : colIndex === 8
                              ? "rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]"
                              : "border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]"
                        }
                      >
                        <div className="h-5 w-[90px] animate-pulse rounded-full bg-[#ececec]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentTableLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-4 py-8 text-center text-[14px] text-[#737373]"
                  >
                    No attendance logs found.
                  </td>
                </tr>
              ) : (
                recentTableLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{formatTime(log.createdAt)}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px] font-medium text-[#1f1f1f]">
                      {log.student.fullName}
                    </td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{log.student.rollNo}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{log.student.year}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{log.session.department}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{log.session.teacherName}</td>
                    <td className="border-y border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">{log.session.subject}</td>
                    <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-4 py-[11px]">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusChipClassName(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {metrics.error ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {metrics.error}
        </div>
      ) : null}
    </section>
  )
}

function formatCount(value: number, loading: boolean, padTwo = false) {
  if (loading) {
    return "--"
  }

  if (padTwo) {
    return value.toString().padStart(2, "0")
  }

  return value.toLocaleString()
}

function formatDate(value: string) {
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

function formatTime(value: string) {
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

function getStatusChipClassName(status: AttendanceStatus) {
  if (status === "PRESENT") {
    return "bg-emerald-100 text-emerald-700"
  }
  if (status === "ABSENT") {
    return "bg-rose-100 text-rose-700"
  }
  return "bg-amber-100 text-amber-700"
}
