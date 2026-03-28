"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

export default function CreateTeacher() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function createInvite() {
    if (!fullName || !email || !department) return
    setStatus("loading")
    setMessage("")

    const res = await fetch("/api/admin/teacher-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, department }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? "Failed to create teacher invite")
      return
    }

    toast.success(`Invite sent to ${data.email} for ${data.fullName}`)
    setFullName("")
    setEmail("")
    setDepartment("")
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Teacher full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={status === "loading"}
      />

      <Input
        placeholder="Teacher Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
      />

      <Input
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        disabled={status === "loading"}
      />

      <Button type="button" onClick={createInvite} disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send Invite"}
      </Button>


    </div>
  )
}