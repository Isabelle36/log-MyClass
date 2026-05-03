"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"

export default function UploadStudentsCsv() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function uploadCsv() {
    if (!file) {
      toast.error("Please select a CSV file")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/students-upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "CSV upload failed")
        return
      }

      toast.success(`All ${data.total} students have been successfully imported!`)
      setFile(null)
    } catch {
      toast.error("Something went wrong while uploading the file")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        disabled={isLoading}
      />
      <p className="text-xs text-muted-foreground">
        CSV columns: fullName, email, department, year, rollNo
      </p>

      <Button type="button" onClick={uploadCsv} disabled={isLoading || !file}>
        {isLoading ? "Uploading..." : "Upload Students CSV"}
      </Button>
    </div>
  )
}