"use client"

import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type SessionData = {
  id: string
  subject: string
  department: string
  year: number
  expiresAt: string
  createdAt: string
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

export default function TeacherAttendanceLiveClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")?.trim() ?? ""

  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [timerReady, setTimerReady] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [endingSession, setEndingSession] = useState(false)

  const scanUrl = useMemo(() => {
    if (!sessionId || typeof window === "undefined") {
      return ""
    }

    return `${window.location.origin}/scan?sessionId=${encodeURIComponent(sessionId)}`
  }, [sessionId])

  const qrImageUrl = useMemo(() => {
    if (!scanUrl) {
      return ""
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(scanUrl)}`
  }, [scanUrl])

  const syncSummary = useCallback(async () => {
    if (!sessionId) {
      setLoading(false)
      setError("Missing session id")
      return
    }

    try {
      const res = await fetch(`/api/teacher/attendance/summary?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: "no-store",
      })
      const data = (await res.json()) as SummaryResponse

      if (!res.ok) {
        setError(data.error ?? "Failed to load session")
        setSummary(null)
        return
      }

      setSummary(data)
      setError(null)
    } catch {
      setError("Failed to load session")
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    void syncSummary()

    const poller = window.setInterval(() => {
      void syncSummary()
    }, 3000)

    return () => {
      window.clearInterval(poller)
    }
  }, [syncSummary])

  useEffect(() => {
    if (!summary) {
      setTimerReady(false)
      return
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(summary.session.expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
      setTimerReady(true)
    }

    tick()
    const timer = window.setInterval(tick, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [summary])

  useEffect(() => {
    if (!summary || redirecting || !timerReady) {
      return
    }

    if (secondsLeft > 0 && !summary.isExpired) {
      return
    }

    setRedirecting(true)
    router.replace("/teacher/dashboard")
  }, [secondsLeft, summary, redirecting, router, timerReady])

  const copyScanUrl = async () => {
    if (!scanUrl) return

    try {
      await navigator.clipboard.writeText(scanUrl)
      toast.success("Scan link copied")
    } catch {
      toast.error("Unable to copy link")
    }
  }

  const downloadQr = async () => {
    if (!qrImageUrl) return

    try {
      const res = await fetch(qrImageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `attendance-qr-${sessionId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("QR downloaded")
    } catch {
      window.open(qrImageUrl, "_blank", "noopener,noreferrer")
    }
  }

  const manuallyEndSession = async () => {
    if (!summary || endingSession) {
      return
    }

    setEndingSession(true)

    try {
      const res = await fetch("/api/teacher/attendance/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: summary.session.id }),
      })

      const data = (await res.json()) as { ended?: boolean; error?: string }

      if (!res.ok || !data.ended) {
        toast.error(data.error ?? "Failed to end session")
        return
      }

      toast.success("Session ended")
      router.replace("/teacher/dashboard")
    } catch {
      toast.error("Failed to end session")
    } finally {
      setEndingSession(false)
    }
  }

  const canManuallyEnd = !!summary && !summary.isExpired && secondsLeft > 0

  return (
    <section className="relative h-screen overflow-hidden bg-white px-4 py-3 md:px-6 md:py-4">
      <div aria-hidden="true" className="pointer-events-none absolute -left-[130px] -top-[120px] h-[620px] w-[620px]">
        <div className="absolute left-0 top-0 h-[417px] w-[417px] rounded-full bg-[#b7e7ff]/70 blur-[55px]" />
        <div className="absolute left-[120px] top-[58px] h-[417px] w-[417px] rounded-full bg-white blur-[65px]" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[170px] -right-[140px] h-[640px] w-[640px]">
        <div className="absolute bottom-0 right-0 h-[440px] w-[440px] rounded-full bg-[#839aff]/78 blur-[75px]" />
        <div className="absolute bottom-[126px] right-[150px] h-[420px] w-[420px] rounded-full bg-white blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] min-h-0 flex-col gap-4">
        <h1 className="shrink-0 text-center font-[var(--font-lora)] text-[34px] leading-tight tracking-[-0.8px] text-[#40444b] md:text-[44px]">
          Scan The Qr Code & Mark Your Attendance
        </h1>

        {loading ? (
          <div className="rounded-[18px] border border-[#dedede] bg-white/80 p-8 text-center text-[#5f636a]">Loading session...</div>
        ) : error || !summary ? (
          <div className="space-y-4 rounded-[18px] border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-rose-700">{error ?? "Session not found"}</p>
            <Button
              type="button"
              onClick={() => router.replace("/teacher/dashboard")}
              className="h-[44px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-5 text-[15px] font-semibold tracking-[-0.3px] text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-hidden">
            <div className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
              <div className="space-y-2">
                <p className="text-[22px] leading-[1.2] tracking-[-0.3px] text-[#22262d] md:text-[24px]">
                  <span className="font-semibold">Session:</span>{" "}
                  <span className="font-normal">{summary.session.subject} | {summary.session.department} | Year {summary.session.year}</span>
                </p>
                <p className="text-[22px] leading-[1.2] tracking-[-0.3px] text-[#22262d] md:text-[24px]">
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="font-normal">Active </span>
                  <span className="text-[#2285da]">({secondsLeft} Seconds Left)</span>
                </p>
                <p className="text-[22px] leading-[1.2] tracking-[-0.3px] text-[#22262d] md:text-[24px]">
                  <span className="font-semibold">Present:</span>{" "}
                  <span className="text-[#2285da]">{summary.presentCount}/{summary.totalStudents}</span>
                </p>
                <Button
                  type="button"
                  onClick={manuallyEndSession}
                  disabled={!canManuallyEnd || endingSession}
                  className="h-10 rounded-full border border-[#2c2f35] bg-[linear-gradient(180deg,#3a3d43_0%,#24272d_100%)] px-4 text-[13px] font-semibold text-white"
                >
                  {endingSession ? "Ending..." : "End Session"}
                </Button>
              </div>

              <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-3">
                <div className="rounded-[4px] border-[6px] border-[#ececec] bg-white p-2">
                  {qrImageUrl ? <img src={qrImageUrl} alt="Attendance QR" className="h-[180px] w-[180px]" /> : null}
                </div>

                <div className="flex h-[64px] w-full items-center gap-2 rounded-[14px] border-[4px] border-[#d5eeff] bg-[#bfe5ff] px-3">
                  <p className="min-w-0 flex-1 truncate text-[14px] tracking-[-0.2px] text-[#4b5360]">{scanUrl}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={copyScanUrl}
                      className="h-9 rounded-full border border-[#2c2f35] bg-[linear-gradient(180deg,#3a3d43_0%,#24272d_100%)] px-3 text-[12px] font-medium text-white"
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      onClick={downloadQr}
                      className="h-9 rounded-full border border-[#2c2f35] bg-[linear-gradient(180deg,#3a3d43_0%,#24272d_100%)] px-3 text-[12px] font-medium text-white"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 rounded-[18px] border border-[#d7d7d7] bg-white/95 p-3">
              <div className="h-full overflow-auto">
                <table className="w-full min-w-[820px] border-separate border-spacing-y-1.5">
                  <thead>
                    <tr className="text-left text-[14px] font-semibold tracking-[-0.2px] text-[#202228]">
                      <th className="px-3 py-1">Student</th>
                      <th className="px-3 py-1">Roll</th>
                      <th className="px-3 py-1">Marked At</th>
                      <th className="px-3 py-1">Email</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] tracking-[-0.1px] text-[#30333a]">
                    {summary.attendees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="rounded-[10px] border border-[#ececec] bg-[#fbfbfb] px-3 py-6 text-center text-[13px] text-[#737373]">
                          No attendance marked yet.
                        </td>
                      </tr>
                    ) : (
                      summary.attendees.map((entry) => (
                        <tr key={entry.id}>
                          <td className="rounded-l-[10px] border border-r-0 border-[#ececec] bg-[#fbfbfb] px-3 py-2">
                            {entry.student.fullName}
                          </td>
                          <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-2">{entry.student.rollNo}</td>
                          <td className="border-y border-[#ececec] bg-[#fbfbfb] px-3 py-2">{formatMarkedAt(entry.createdAt)}</td>
                          <td className="rounded-r-[10px] border border-l-0 border-[#ececec] bg-[#fbfbfb] px-3 py-2">{entry.student.email ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function formatMarkedAt(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return "-"
  }

  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}  ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`
}
