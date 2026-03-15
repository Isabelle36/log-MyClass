"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type UploadStatus = "idle" | "loading" | "success" | "error"

export default function UploadStudentsCsv() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [message, setMessage] = useState("")

  async function uploadCsv() {
    if (!file) {
      return
    }

    setStatus("loading")
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/admin/students-upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      setStatus("error")
      setMessage(data.error ?? "CSV upload failed")
      return
    }

    setStatus("success")
    setMessage(
      `Processed ${data.total}. Created ${data.created}, updated ${data.updated}, failed ${data.failed}.`
    )
    setFile(null)
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        disabled={status === "loading"}
      />
      <p className="text-xs text-muted-foreground">
        CSV columns: fullName, email, department, year, rollNo
      </p>

      <Button type="button" onClick={uploadCsv} disabled={status === "loading" || !file}>
        {status === "loading" ? "Uploading..." : "Upload Students CSV"}
      </Button>

      {status === "success" && <p className="text-sm text-green-600">{message}</p>}
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}