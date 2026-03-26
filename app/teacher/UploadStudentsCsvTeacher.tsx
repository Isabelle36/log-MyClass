"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type UploadStatus = "idle" | "loading" | "success" | "error"

export default function UploadStudentsFileTeacher() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [message, setMessage] = useState("")

  function isSupportedSpreadsheetFile(candidate: File) {
    const name = candidate.name.toLowerCase()
    return (
      name.endsWith(".csv") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    )
  }

  async function uploadStudentsFile() {
    if (!file) return

    if (!isSupportedSpreadsheetFile(file)) {
      setStatus("error")
      setMessage("Only .csv, .xlsx, and .xls files are allowed")
      return
    }

    setStatus("loading")
    setMessage("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/teacher/students-upload", {
        method: "POST",
        body: formData,
      })

      const data = (await res.json()) as {
        error?: string
        total?: number
        created?: number
        updated?: number
        failed?: number
      }

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "File upload failed")
        return
      }

      setStatus("success")
      setMessage(
        `Processed ${data.total ?? 0}. Created ${data.created ?? 0}, updated ${data.updated ?? 0}, failed ${data.failed ?? 0}.`
      )
      setFile(null)
    } catch {
      setStatus("error")
      setMessage("Something went wrong while uploading the file")
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        disabled={status === "loading"}
      />

      <p className="text-xs text-muted-foreground">
        Supported files: CSV, XLSX, XLS. Required columns: Full name, Email, Department, Year, Roll no
      </p>

      <Button
        type="button"
        onClick={uploadStudentsFile}
        disabled={status === "loading" || !file}
      >
        {status === "loading" ? "Uploading..." : "Upload Students File"}
      </Button>

      {status === "success" && <p className="text-sm text-green-600">{message}</p>}
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}