"use client"

import { useState } from "react"

export default function CreateTeacher() {
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function createInvite() {
    if (!email || !department) return
    setStatus("loading")
    setMessage("")

    const res = await fetch("/api/admin/teacher-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, department }),
    })

    const data = await res.json()

    if (!res.ok) {
      setStatus("error")
      setMessage(data.error ?? "Failed to send invite")
      return
    }

    setStatus("success")
    setMessage(`Invite sent to ${data.email}`)
    setEmail("")
    setDepartment("")
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        placeholder="Teacher Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
      />

      <input
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        disabled={status === "loading"}
      />

      <button onClick={createInvite} disabled={status === "loading"}>
        {status === "loading" ? "Sending\u2026" : "Send Invite"}
      </button>

      {status === "success" && (
        <p className="text-green-600 text-sm">{message}</p>
      )}

      {status === "error" && (
        <p className="text-red-600 text-sm">{message}</p>
      )}
    </div>
  )
}