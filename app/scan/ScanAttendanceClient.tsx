"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export default function ScanAttendanceClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isRestricted, setIsRestricted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [locationBlocked, setLocationBlocked] = useState(false)
  const [locationHint, setLocationHint] = useState<string | null>(null)
  const autoAttemptedRef = useRef(false)

  const getCurrentPosition = useCallback(
    (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      }),
    []
  )

  const getBestEffortLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return null
    }

    // Fast path first: allow cached/network location so marking doesn't feel slow.
    try {
      return await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 3500,
        maximumAge: 120_000,
      })
    } catch {
      // Fall through to high-accuracy request.
    }

    try {
      return await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0,
      })
    } catch {
      return null
    }
  }, [getCurrentPosition])

  const requestLocationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationHint("Location permission works only on HTTPS or localhost. Ask your teacher for the normal app link, not an insecure link.")
      setLocationBlocked(true)
      return false
    }

    const position = await getBestEffortLocation()
    if (!position) {
      setLocationBlocked(true)
      setLocationHint("Location is blocked. Enable location for this site in browser settings, then tap Enable Location again.")
      return false
    }

    setLocationBlocked(false)
    setLocationHint(null)
    return true
  }, [getBestEffortLocation])

  const markAttendance = useCallback(async () => {
    setLoading(true)
    setLocationHint(null)

    const payload: { sessionId: string; latitude?: number; longitude?: number; accuracy?: number } = {
      sessionId,
    }

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      const position = await getBestEffortLocation()
      if (position) {
        payload.latitude = position.coords.latitude
        payload.longitude = position.coords.longitude
        payload.accuracy = position.coords.accuracy
      }
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
      remainingMeters?: number
      radiusMeters?: number
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
        setLocationBlocked(true)
        setLocationHint("Tap Enable Location below, then retry attendance.")
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      if (data.errorCode === "SESSION_CLASS_MISMATCH") {
        const msg = "This QR belongs to a different class/year than your account. Ask your teacher for the correct class QR."
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      if (data.errorCode === "GEOFENCE_VIOLATION") {
        const formatDistance = (meters?: number) => {
          if (typeof meters !== "number") return ""
          if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
          if (meters >= 10) return `${meters.toFixed(0)} m`
          return `${meters.toFixed(1)} m`
        }

        const distanceText = formatDistance(data.distanceMeters)
        const radiusText = formatDistance(data.radiusMeters)
        const remainingValue = typeof data.remainingMeters === "number" ? data.remainingMeters : undefined
        const remainingText = formatDistance(remainingValue)

        let msg = "You're outside the classroom range for this session."
        if (distanceText && radiusText) {
          msg = `You're ${distanceText} from the session location. Allowed: ${radiusText}.`
        }
        if (remainingValue !== undefined) {
          msg += remainingValue >= 1
            ? ` Move about ${remainingText} closer and try again.`
            : " You're right at the boundary. Move a little closer and try again."
        }
        msg += " Attendance can only be marked inside the classroom range."
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
    setLocationBlocked(false)
    setErrorMessage(null)
    setLoading(false)
    toast.success(data.message ?? "Attendance marked")

    setTimeout(() => {
      router.push("/student")
    }, 1500)
  }, [getBestEffortLocation, router, sessionId])

  useEffect(() => {
    if (autoAttemptedRef.current) {
      return
    }

    autoAttemptedRef.current = true

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        await requestLocationPermission()
        await markAttendance()
      })()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [markAttendance, requestLocationPermission])

  const enableLocationAndRetry = async () => {
    const allowed = await requestLocationPermission()
    if (!allowed) {
      return
    }

    void markAttendance()
  }

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
      {locationHint && !loading ? <p className="text-xs text-amber-700">{locationHint}</p> : null}

      {locationBlocked && !isRestricted ? (
        <Button type="button" variant="outline" onClick={enableLocationAndRetry} disabled={loading}>
          Enable Location
        </Button>
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
