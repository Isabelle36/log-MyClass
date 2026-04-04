"use client"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { getSubjectsForDepartmentYear } from "@/lib/curriculum"
import { Input } from "@/components/ui/input"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SessionCreateResponse = {
  session?: {
    id: string
  }
  error?: string
}

const YEARS = ["1", "2", "3"]
const DEPARTMENTS = ["BCA", "BBA"]
export default function AttendanceSessionPanel() {
  const router = useRouter()
  const [department, setDepartment] = useState("BCA")
  const [subject, setSubject] = useState("")
  const [year, setYear] = useState("1")
  const [durationSeconds, setDurationSeconds] = useState("300")
  const [radiusMeters, setRadiusMeters] = useState("10")
  const [creating, setCreating] = useState(false)

  const subjectOptions = useMemo(() => {
    return getSubjectsForDepartmentYear(department, Number(year))
  }, [department, year])

  const resolvedSubject = useMemo(() => {
    if (subjectOptions.includes(subject)) {
      return subject
    }

    return subjectOptions[0] ?? ""
  }, [subject, subjectOptions])

  const createSession = async () => {
    const seconds = Number(durationSeconds)
    const radius = Number(radiusMeters)

    if (!resolvedSubject || !year || !durationSeconds || !radiusMeters) {
      toast.error("Please fill all session fields")
      return
    }

    if (!Number.isInteger(seconds) || seconds < 30 || seconds > 300) {
      toast.error("Duration must be between 30 and 300 seconds")
      return
    }

    if (!Number.isFinite(radius) || radius < 5 || radius > 300) {
      toast.error("Radius must be between 5 and 300 meters")
      return
    }

    setCreating(true)

    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        toast.error("Location is required to start session")
        return
      }

      const teacherLocation = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      }).catch(() => null)

      if (!teacherLocation) {
        toast.error("Allow location permission to start session")
        return
      }

      const res = await fetch("/api/teacher/attendance/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: resolvedSubject,
          department,
          year: Number(year),
          durationSeconds: seconds,
          latitude: teacherLocation.coords.latitude,
          longitude: teacherLocation.coords.longitude,
          radiusMeters: radius,
        }),
      })

      const data = (await res.json()) as SessionCreateResponse

      if (!res.ok || !data.session?.id) {
        toast.error(data.error ?? "Failed to create session")
        return
      }

      router.push(`/teacher-attendance?sessionId=${encodeURIComponent(data.session.id)}`)
    } catch {
      toast.error("Failed to create session")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        <div>
          <label className="text-[13px] font-medium tracking-[-0.2px] text-[#2d2d2d]">Class</label>
          <DropdownSelect
            value={department}
            onValueChange={setDepartment}
            disabled={creating}
            options={DEPARTMENTS.map((dept) => ({ value: dept, label: dept }))}
            triggerClassName="mt-1 h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px] text-[#303030]"
            ariaLabel="Attendance class"
          />
        </div>

        <div>
          <label className="text-[13px] font-medium tracking-[-0.2px] text-[#2d2d2d]">Subject</label>
          <DropdownSelect
            value={resolvedSubject}
            onValueChange={setSubject}
            disabled={creating || subjectOptions.length === 0}
            options={
              subjectOptions.length === 0
                ? [{ value: "", label: "No subjects configured", disabled: true }]
                : subjectOptions.map((option) => ({ value: option, label: option }))
            }
            triggerClassName="mt-1 h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px] text-[#303030]"
            ariaLabel="Attendance subject"
          />
        </div>

        <div>
          <label className="text-[13px] font-medium tracking-[-0.2px] text-[#2d2d2d]">Year</label>
          <DropdownSelect
            value={year}
            onValueChange={setYear}
            disabled={creating}
            options={YEARS.map((itemYear) => ({ value: itemYear, label: `Year ${itemYear}` }))}
            triggerClassName="mt-1 h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px] text-[#303030]"
            ariaLabel="Attendance year"
          />
        </div>

        <div>
          <label className="text-[13px] font-medium tracking-[-0.2px] text-[#2d2d2d]">Duration (sec)</label>
          <Input
            type="number"
            min={30}
            max={800}
            step={10}
            inputMode="numeric"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(event.target.value)}
            disabled={creating}
            className="mt-1 h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
          />
        </div>

        <div>
          <label className="text-[13px] font-medium tracking-[-0.2px] text-[#2d2d2d]">Radius (m)</label>
          <Input
            type="number"
            min={5}
            max={300}
            step={1}
            inputMode="numeric"
            value={radiusMeters}
            onChange={(event) => setRadiusMeters(event.target.value)}
            disabled={creating}
            className="mt-1 h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
          />
        </div>

        <div className="md:pt-[23px]">
          <Button
            type="button"
            onClick={createSession}
            disabled={creating}
            className="h-[44px] w-full rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] text-[15px] font-semibold tracking-[-0.3px] text-white"
          >
            {creating ? "Starting..." : "Start"}
          </Button>
        </div>
      </div>

      <p className="text-[12px] tracking-[-0.2px] text-[#707070]">
        Starting a session will open a dedicated QR page with live timer and attendance updates.
        Radius controls how close students must be to mark attendance.
      </p>
    </div>
  )
}
