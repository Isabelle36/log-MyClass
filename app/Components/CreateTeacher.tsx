"use client"

import { Button } from "@/components/ui/button"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Input } from "@/components/ui/input"
import { CURRICULUM_BY_DEPARTMENT_YEAR } from "@/lib/curriculum"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const DEPARTMENT_VALUES = Object.keys(CURRICULUM_BY_DEPARTMENT_YEAR)
const DEPARTMENT_OPTIONS = (DEPARTMENT_VALUES.length > 0 ? DEPARTMENT_VALUES : ["BCA", "BBA"]).map(
  (department) => ({
    label: department,
    value: department,
  })
)

export default function CreateTeacher() {
  const defaultDepartment = DEPARTMENT_OPTIONS[0]?.value ?? "BCA"

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState(defaultDepartment)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function createInvite() {
    if (!fullName.trim() || !email.trim() || !department.trim()) {
      toast.error("Full name, email and department are required")
      return
    }

    setIsSubmitting(true)

    try {
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
      setDepartment(defaultDepartment)
    } catch {
      toast.error("Something went wrong while sending the invite")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative -mx-[14px] -mt-[20px] min-h-[calc(100vh-78px)] overflow-hidden bg-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-[120px] -top-[130px] h-[620px] w-[620px]">
        <div className="absolute left-0 top-0 h-[417px] w-[417px] rounded-full bg-[#b7e7ff]/70 blur-[55px]" />
        <div className="absolute left-[120px] top-[58px] h-[417px] w-[417px] rounded-full bg-white blur-[65px]" />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute -bottom-[170px] -right-[140px] h-[640px] w-[640px]">
        <div className="absolute bottom-0 right-0 h-[440px] w-[440px] rounded-full bg-[#839aff]/78 blur-[75px]" />
        <div className="absolute bottom-[126px] right-[150px] h-[420px] w-[420px] rounded-full bg-white blur-[80px]" />
        <div className="absolute bottom-[-20px] right-[20px] h-[220px] w-[220px] rounded-full bg-[#a2b3ff]/55 blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-78px)] w-full max-w-[1536px] flex-col items-center px-6 pb-[72px] pt-[48px] text-[#111317] lg:pb-[128px]">
        <h1 className="text-center text-[34px] leading-[42px] font-normal tracking-[-0.02em] text-[#06070b] md:text-[52px] md:leading-[64px]">
          Invite a Teacher
        </h1>

        <div className="mt-[96px] w-full max-w-[920px] space-y-8 md:space-y-[52px] lg:mt-[185px]">
          <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)] md:items-center lg:grid-cols-[387px_533px]">
            <label htmlFor="teacher-fullname" className="text-[18px] leading-[25px] tracking-[-0.02em] text-[#111216] md:text-[20px]">
              Teacher Full Name
            </label>
            <Input
              id="teacher-fullname"
              placeholder="Enter teacher's name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isSubmitting}
              className="h-[69px] rounded-[18px] border-[#ccd7e0] bg-[#d3dce3] px-[19px] text-[17px] leading-[26px] text-[#30353a] placeholder:text-[#5f6871] placeholder:opacity-95 focus-visible:border-[#b8c8d4] focus-visible:ring-0 md:text-[18px]"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)] md:items-center lg:grid-cols-[387px_533px]">
            <label htmlFor="teacher-email" className="text-[18px] leading-[25px] tracking-[-0.02em] text-[#111216] md:text-[20px]">
              Teacher&apos;s Email
            </label>
            <Input
              id="teacher-email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="h-[69px] rounded-[18px] border-[#ccd7e0] bg-[#d3dce3] px-[19px] text-[17px] leading-[26px] text-[#30353a] placeholder:text-[#5f6871] placeholder:opacity-95 focus-visible:border-[#b8c8d4] focus-visible:ring-0 md:text-[18px]"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)] md:items-center lg:grid-cols-[387px_533px]">
            <label className="text-[18px] leading-[25px] tracking-[-0.02em] text-[#111216] md:text-[20px]">
              Departement
            </label>
            <DropdownSelect
              value={department}
              onValueChange={setDepartment}
              options={DEPARTMENT_OPTIONS}
              disabled={isSubmitting}
              ariaLabel="Select department"
              triggerClassName="h-[69px] rounded-[18px] border-[#ccd7e0] bg-[#d3dce3] px-[13px] text-[17px] leading-[26px] text-[#30353a] hover:bg-[#d3dce3] focus-visible:border-[#b8c8d4] focus-visible:ring-0 md:text-[18px]"
              contentClassName="rounded-[18px] border-[#ccd7e0] bg-[#eaf0f4] p-1"
              itemClassName="text-[16px] md:text-[18px]"
              chevronClassName="size-5 text-[#0b0f13]"
            />
          </div>
        </div>

        <div className="mt-[96px] flex w-full justify-center lg:mt-[179px]">
          <Button
            type="button"
            onClick={createInvite}
            disabled={isSubmitting}
            className="h-[55px] w-full max-w-[513px] rounded-[12px] border border-[#44464d] bg-[linear-gradient(180deg,#37393f_0%,#26282e_100%)] text-[18px] leading-[27px] font-normal tracking-[-0.02em] text-[#f7f8fb] shadow-[0_8px_22px_rgba(0,0,0,0.26)] hover:brightness-[1.06]"
          >
            {isSubmitting ? "Sending..." : "Send the Invite"}
            {!isSubmitting ? <ArrowRight className="ml-1 size-5" strokeWidth={2.2} aria-hidden="true" /> : null}
          </Button>
        </div>
      </div>
    </section>
  )
}