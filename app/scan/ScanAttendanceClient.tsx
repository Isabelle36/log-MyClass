"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export default function ScanAttendanceClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isRestricted, setIsRestricted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const autoAttemptedRef = useRef(false)

  const markAttendance = async () => {
    setLoading(true)

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
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
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
      distanceMeters?: number
    }

    if (!res.ok) {
      setLoading(false)
      setIsRestricted(data.errorCode === "ACCOUNT_RESTRICTED")

      if (data.errorCode === "ACCOUNT_RESTRICTED") {
        const msg = "Your account is restricted. Please contact your dean to reactivate it."
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      if (data.errorCode === "LOCATION_REQUIRED") {
        const msg =
          "Turn on location services and allow this browser to access your location, then try again from the classroom."
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      if (data.errorCode === "GEOFENCE_VIOLATION") {
        const distanceText =
          typeof data.distanceMeters === "number" ? `You seem to be about ${data.distanceMeters}m away. ` : ""
        const msg =
          `${distanceText}You must be inside the classroom to mark attendance. Please move closer and try again.`
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      const generic = data.error ?? "Could not mark attendance"
      setErrorMessage(generic)
      toast.error(generic)
      return
    }

    setIsRestricted(false)
    setErrorMessage(null)
    toast.success(data.message ?? "Attendance marked")

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

      {loading ? <p className="text-sm">Marking attendance...</p> : null}
      {errorMessage && !loading ? (
        <p className="text-xs text-red-700">{errorMessage}</p>
      ) : null}

      <Button
        type="button"
        onClick={markAttendance}
        disabled={loading || isRestricted}
      >
        {loading ? "Please wait..." : "Mark Attendance"}
      </Button>
    </div>
  )
}
