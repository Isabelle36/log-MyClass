"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type MarkStatus = "idle" | "loading" | "success" | "error"

export default function ScanAttendanceClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<MarkStatus>("idle")
  const [message, setMessage] = useState("")
  const [isRestricted, setIsRestricted] = useState(false)
  const autoAttemptedRef = useRef(false)

  const markAttendance = async () => {
    setStatus("loading")
    setMessage("")

    const payload: { sessionId: string; latitude?: number; longitude?: number } = { sessionId }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            payload.latitude = position.coords.latitude
            payload.longitude = position.coords.longitude
            resolve()
          },
          () => resolve(),
          { timeout: 5000 }
        )
      })
    }

    const res = await fetch("/api/student/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = (await res.json()) as {
      success?: boolean
      message?: string
      error?: string
      errorCode?: string
    }

    if (!res.ok) {
      setStatus("error")
      setIsRestricted(data.errorCode === "ACCOUNT_RESTRICTED")
      setMessage(data.error ?? "Could not mark attendance")
      return
    }

    setIsRestricted(false)
    setStatus("success")
    setMessage(data.message ?? "Attendance marked")

    setTimeout(() => {
      router.push("/student")
    }, 1500)
  }

  useEffect(() => {
    if (autoAttemptedRef.current) {
      return
    }

    autoAttemptedRef.current = true
    void markAttendance()
  }, [sessionId])

  return (
    <div
      className={`mx-auto max-w-md space-y-4 rounded-2xl border p-6 ${
        isRestricted ? "border-red-300 bg-red-50" : ""
      }`}
    >
      <h1 className="text-2xl font-semibold">Scan Attendance</h1>
      <p className="text-sm text-muted-foreground break-all">Session: {sessionId}</p>

      {status === "loading" ? <p className="text-sm">Marking attendance...</p> : null}
      {status === "success" ? (
        <div className="space-y-4">
          <p className="text-sm text-green-600">{message}</p>
          <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="space-y-2">
          <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
            <AlertTitle>Could Not Mark Attendance</AlertTitle>
            <AlertDescription>
              <p>{message}</p>
            </AlertDescription>
          </Alert>
          {isRestricted ? (
            <p className="text-xs text-red-700">
              Contact your dean to reactivate your account. Once reactivated, you can mark
              attendance again.
            </p>
          ) : null}
        </div>
      ) : null}

      <Button
        type="button"
        onClick={markAttendance}
        disabled={status === "loading" || status === "success" || isRestricted}
      >
        {status === "success" ? "✅ Marked" : status === "loading" ? "Please wait..." : "Mark Attendance"}
      </Button>
    </div>
  )
}
