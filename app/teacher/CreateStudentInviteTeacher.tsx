"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type InviteStatus = "idle" | "loading" | "success" | "error"

export default function CreateStudentInviteTeacher() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("BCA")
  const [year, setYear] = useState("1")
  const [rollNo, setRollNo] = useState("")
  const [status, setStatus] = useState<InviteStatus>("idle")
  const [message, setMessage] = useState("")

  async function createInvite() {
    if (!fullName || !email || !year || !rollNo) {
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/teacher/student-invite", {
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

      const data = (await res.json()) as { error?: string; email?: string; department?: string }

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Failed to create student invite")
        return
      }

      setStatus("success")
      setMessage(`Invite sent to ${data.email ?? email}`)
      setFullName("")
      setEmail("")
      setDepartment("BCA")
      setYear("1")
      setRollNo("")
    } catch {
      setStatus("error")
      setMessage("Unexpected server response. Please try again.")
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

      <div className="grid grid-cols-2 gap-2">
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          disabled={status === "loading"}
          className="h-9 rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="BBA">BBA</option>
          <option value="BCA">BCA</option>
        </select>
        <select
          value={year}
          onChange={(event) => setYear(event.target.value)}
          disabled={status === "loading"}
          className="h-9 rounded-4xl border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2">
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

      {status === "success" && <p className="text-sm text-green-600">{message}</p>}
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}
