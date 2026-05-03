"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

type InviteStatus = "idle" | "loading" | "success" | "error"

export default function CreateStudentInvite() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [status, setStatus] = useState<InviteStatus>("idle")
  const [message, setMessage] = useState("")

  async function createInvite() {
    if (!fullName || !email || !department || !year || !rollNo) {
      toast.error("Please fill in all fields")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/admin/student-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          department,
          year: Number(year),
          rollNo: Number(rollNo),
        }),
      })

      const raw = await res.text()
      const data = raw ? (JSON.parse(raw) as { error?: string; email?: string }) : {}

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create student invite")
        return
      }

      toast.success(`Invite sent to ${data.email ?? email}`)
      setFullName("")
      setEmail("")
      setDepartment("")
      setYear("")
      setRollNo("")
    } catch {
      toast.error("Unexpected server response. Please try again.")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Student full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        disabled={status === "loading"}
      />

      <Input
        placeholder="Student email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === "loading"}
      />

      <Input
        placeholder="Department"
        value={department}
        onChange={(event) => setDepartment(event.target.value)}
        disabled={status === "loading"}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Year"
          inputMode="numeric"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          disabled={status === "loading"}
        />
        <Input
          placeholder="Roll no"
          inputMode="numeric"
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          disabled={status === "loading"}
        />
      </div>

      <Button type="button" onClick={createInvite} disabled={status === "loading"}>
        {status === "loading" ? "Creating..." : "Create Student Invite"}
      </Button>


    </div>
  )
}