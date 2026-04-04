"use client"

import { useEffect, useMemo, useState } from "react"

type RecentAttendanceStatus = "PRESENT" | "ABSENT"

type RecentAttendanceRow = {
  id: string
  status: RecentAttendanceStatus
  sessionCreatedAt: string
  markedAt: string | null
  session: {
    id: string
    subject: string
    department: string
    year: number
  }
  student: {
    id: string
    fullName: string
    email: string | null
    rollNo: number
    department: string
    year: number
  }
}

type RecentAttendanceResponse = {
  rows: RecentAttendanceRow[]
  total: number
  presentCount: number
  absentCount: number
  error?: string
}

export default function TeacherRecentAttendanceTable() {
  const [rows, setRows] = useState<RecentAttendanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecent = async () => {
    try {
      const res = await fetch("/api/teacher/attendance/recent?limit=80", { cache: "no-store" })
      const data = (await res.json()) as RecentAttendanceResponse

      if (!res.ok) {
        setRows([])
        setError(data.error ?? "Failed to load recent attendance logs")
        return
      }

      setRows(Array.isArray(data.rows) ? data.rows : [])
      setError(null)
    } catch {
      setRows([])
      setError("Failed to load recent attendance logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRecent()

    const intervalId = window.setInterval(() => {
      void loadRecent()
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const counts = useMemo(() => {
    let present = 0
    let absent = 0

    for (const row of rows) {
      if (row.status === "PRESENT") present += 1
      if (row.status === "ABSENT") absent += 1
    }

    return { present, absent }
  }, [rows])

  return (
    <section className="space-y-3 rounded-[23px] border border-[#cecdcd] bg-white p-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[24px] font-semibold tracking-[-0.72px] text-[#2a2a2a]">Recent Attendance</h2>
        <p className="text-[13px] tracking-[-0.26px] text-[#6d6d6d]">
          Present: {counts.present} | Absent: {counts.absent}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-separate border-spacing-y-[9px]">
          <thead>
            <tr className="text-left text-[15px] font-semibold tracking-[-0.3px] text-black">
              <th className="px-3 py-1">Date</th>
              <th className="px-3 py-1">Time</th>
              <th className="px-3 py-1">Student</th>
              <th className="px-3 py-1">Roll</th>
              <th className="px-3 py-1">Class</th>
              <th className="px-3 py-1">Subject</th>
              <th className="px-3 py-1">Status</th>
            </tr>
          </thead>
          <tbody className="text-[14px] tracking-[-0.2px] text-[#2a2a2a]">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`teacher-recent-loading-${index}`}>
                  <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <div className="h-5 w-28 animate-pulse rounded-full bg-[#ececec]" />
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-20 animate-pulse rounded-full bg-[#ececec]" /></td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-32 animate-pulse rounded-full bg-[#ececec]" /></td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-14 animate-pulse rounded-full bg-[#ececec]" /></td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-20 animate-pulse rounded-full bg-[#ececec]" /></td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-28 animate-pulse rounded-full bg-[#ececec]" /></td>
                  <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]"><div className="h-5 w-16 animate-pulse rounded-full bg-[#ececec]" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td
                  colSpan={7}
                  className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-6 text-center text-[14px] text-rose-700"
                >
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-8 text-center text-[14px] text-[#737373]"
                >
                  No recent attendance entries.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    {formatDate(row.sessionCreatedAt)}
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    {formatTime(row.markedAt ?? row.sessionCreatedAt)}
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px] font-medium text-[#1f1f1f]">
                    {row.student.fullName}
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{row.student.rollNo}</td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    {row.session.department} | Year {row.session.year}
                  </td>
                  <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">{row.session.subject}</td>
                  <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-[11px]">
                    <span
                      className={
                        row.status === "PRESENT"
                          ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                          : "inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
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
