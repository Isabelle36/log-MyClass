"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

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
      toast.error("Only .csv, .xlsx, and .xls files are allowed")
      return
    }

    setStatus("loading")

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
        toast.error(data.error ?? "File upload failed")
        setStatus("idle")
        return
      }

      const created = data.created ?? 0
      const updated = data.updated ?? 0
      const failed = data.failed ?? 0
      
      if (failed > 0) {
        toast.warning(`Successfully added ${created + updated} students. ${failed} rows failed to process.`)
      } else {
        toast.success(`All ${data.total ?? 0} students have been successfully imported!`)
      }
      
      setStatus("success")
      setFile(null)
    } catch {
      toast.error("Something went wrong while uploading the file")
      setStatus("idle")
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


    </div>
  )
}