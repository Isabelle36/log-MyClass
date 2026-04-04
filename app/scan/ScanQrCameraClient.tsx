"use client"

import { Button } from "@/components/ui/button"
import { BrowserQRCodeReader } from "@zxing/browser"
import { Camera, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

function extractSessionId(value: string) {
  const raw = value.trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    const fromQuery = url.searchParams.get("sessionId")?.trim()
    if (fromQuery) {
      return fromQuery
    }
  } catch {
    // Not a full URL; fall back to relaxed parsing.
  }

  const queryMatch = raw.match(/[?&]sessionId=([^&]+)/i)
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]).trim()
  }

  // If teachers share only a session id, accept it directly.
  return raw
}

export default function ScanQrCameraClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [scanInput, setScanInput] = useState("")
  const [starting, setStarting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true

  const isMobile = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false
    }

    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  }, [])

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
      controlsRef.current = null
      readerRef.current = null
    }
  }, [])

  const onResolvedSession = (sessionId: string) => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanning(false)
    setScanError(null)
    router.replace(`/scan?sessionId=${encodeURIComponent(sessionId)}`)
  }

  const startScanner = async () => {
    if (!videoRef.current || scanning || starting) {
      return
    }

    if (!isSecureContext) {
      const msg =
        "Camera needs a secure context (HTTPS). On phones, HTTP LAN links may not prompt for camera permission."
      setScanError(msg)
      toast.error(msg)
      return
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const msg = "Camera is unavailable in this browser."
      setScanError(msg)
      toast.error(msg)
      return
    }

    setStarting(true)
    setScanError(null)

    try {
      // Request camera permission explicitly so mobile browsers show the prompt.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })
      stream.getTracks().forEach((track) => track.stop())

      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200,
      })
      readerRef.current = reader

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        (result, error) => {
          if (result) {
            const value = result.getText()
            const resolved = extractSessionId(value)

            if (!resolved) {
              toast.error("Invalid QR code")
              return
            }

            setScanError(null)
            toast.success("QR scanned")
            onResolvedSession(resolved)
            return
          }

          if (error && error.name !== "NotFoundException") {
            setScanError("Unable to scan this QR. Try again.")
          }
        }
      )

      controlsRef.current = controls
      setScanning(true)
    } catch (error) {
      const err = error as DOMException | Error
      const lowered = (err.message || "").toLowerCase()

      if (err.name === "NotAllowedError" || lowered.includes("denied")) {
        const msg = "Camera permission denied. Allow camera access in browser settings and try again."
        setScanError(msg)
        toast.error(msg)
      } else if (err.name === "NotFoundError") {
        const msg = "No camera found on this device."
        setScanError(msg)
        toast.error(msg)
      } else {
        const msg = "Camera access failed. Ensure permission is allowed and try again."
        setScanError(msg)
        toast.error(msg)
      }
    } finally {
      setStarting(false)
    }
  }

  const stopScanner = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanning(false)
  }

  const submitManual = () => {
    const sessionId = extractSessionId(scanInput)
    if (!sessionId) {
      toast.error("Paste a valid scan link or session id")
      return
    }

    setScanError(null)
    onResolvedSession(sessionId)
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-[#d9e1f7] bg-white p-5 md:p-6">
      <h1 className="text-[26px] font-semibold tracking-[-0.7px] text-[#1c2230]">Scan Attendance</h1>
      <p className="mt-1 text-[14px] text-[#55607a]">
        {isMobile
          ? "Point your camera at the class QR code. If camera doesn\'t open, use the paste option below."
          : "Open this page on your phone to scan with camera, or paste the scan link below."}
      </p>

      {!isSecureContext && isMobile ? (
        <p className="mt-2 text-[13px] text-amber-700">
          This page is not running on HTTPS, so camera permission may be blocked on mobile browsers.
        </p>
      ) : null}

      {isMobile ? (
        <div className="mt-4 space-y-3">
          <div className="overflow-hidden rounded-xl border border-[#d7def0] bg-[#f7f9ff]">
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={startScanner}
              disabled={starting || scanning}
              className="h-[42px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-4 text-[14px] font-semibold text-white"
            >
              <Camera className="mr-1.5 h-4 w-4" />
              {starting ? "Starting..." : scanning ? "Scanning..." : "Start Camera"}
            </Button>
            <Button type="button" variant="outline" onClick={stopScanner} disabled={!scanning} className="h-[42px] rounded-full px-4">
              Stop
            </Button>
          </div>

          {scanError ? <p className="text-[13px] text-rose-600">{scanError}</p> : null}
        </div>
      ) : (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1.5 text-[13px] font-medium text-[#30407a]">
          <Smartphone className="h-4 w-4" />
          Camera scan is enabled on phone screens.
        </div>
      )}

      <div className="mt-5 space-y-2">
        <label className="text-[13px] font-medium text-[#343a4f]" htmlFor="manual-scan-input">
          Or paste scan link / session id
        </label>
        <div className="flex gap-2">
          <input
            id="manual-scan-input"
            value={scanInput}
            onChange={(event) => setScanInput(event.target.value)}
            placeholder="https://.../scan?sessionId=..."
            className="h-[42px] flex-1 rounded-xl border border-[#cfd7ed] bg-[#fafbff] px-3 text-[14px] outline-none focus:border-[#7f92d4]"
          />
          <Button type="button" onClick={submitManual} className="h-[42px] rounded-full px-4">
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
