"use client"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

type InviteStatus = "idle" | "loading" | "success" | "error"

export default function CreateStudentInviteTeacher() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("BCA")
  const [year, setYear] = useState("1")
  const [rollNo, setRollNo] = useState("")
  const [status, setStatus] = useState<InviteStatus>("idle")

  async function createInvite() {
    if (!fullName || !email || !year || !rollNo) {
      toast.error("Please fill in all fields")
      return
    }

    setStatus("loading")

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
        toast.error(data.error ?? "Failed to create student invite")
        return
      }

      toast.success(`Invite sent to ${data.email ?? email}`)
      setFullName("")
      setEmail("")
      setDepartment("BCA")
      setYear("1")
      setRollNo("")
    } catch {
      toast.error("Unexpected server response. Please try again.")
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="w-full max-w-[760px] space-y-3">
      <Input
        placeholder="Student full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        disabled={status === "loading"}
        className="h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
      />

      <Input
        placeholder="Student email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === "loading"}
        className="h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
      />

      <div className="grid grid-cols-2 gap-2">
        <DropdownSelect
          value={department}
          onValueChange={setDepartment}
          disabled={status === "loading"}
          options={[
            { value: "BBA", label: "BBA" },
            { value: "BCA", label: "BCA" },
          ]}
          triggerClassName="h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
          ariaLabel="Student department"
        />
        <DropdownSelect
          value={year}
          onValueChange={setYear}
          disabled={status === "loading"}
          options={[
            { value: "1", label: "1st Year" },
            { value: "2", label: "2nd Year" },
            { value: "3", label: "3rd Year" },
          ]}
          triggerClassName="h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
          ariaLabel="Student year"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Input
          placeholder="Roll no"
          inputMode="numeric"
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          disabled={status === "loading"}
          className="h-[44px] rounded-[12px] border-[0.5px] border-[#c0c0c0] bg-[#f9f9f9] px-3 text-[15px] tracking-[-0.2px]"
        />
      </div>

      <Button
        type="button"
        onClick={createInvite}
        disabled={status === "loading"}
        className="h-[44px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-5 text-[15px] font-semibold tracking-[-0.3px] text-white"
      >
        {status === "loading" ? "Creating..." : "Create Student Invite"}
      </Button>
    </div>
  )
}
