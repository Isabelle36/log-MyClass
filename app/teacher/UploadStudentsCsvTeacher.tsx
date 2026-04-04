"use client"

import { Button } from "@/components/ui/button"
import FileUpload, { DropZone, FileError, FileList, type FileInfo } from "@/components/ui/file-upload"
import { useState } from "react"
import { toast } from "sonner"

type UploadStatus = "idle" | "loading" | "success" | "error"

export default function UploadStudentsFileTeacher() {
  const [uploadFiles, setUploadFiles] = useState<FileInfo[]>([])
  const [status, setStatus] = useState<UploadStatus>("idle")

  const file = uploadFiles[0]?.file ?? null

  function isSupportedSpreadsheetFile(candidate: File) {
    const name = candidate.name.toLowerCase()
    return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls")
  }

  const handleFileSelectChange = (files: FileInfo[]) => {
    setStatus("idle")
    setUploadFiles(files.slice(0, 1))
  }

  const handleRemove = (fileId: string) => {
    setUploadFiles((previous) => previous.filter((fileItem) => fileItem.id !== fileId))
  }

  const handleClearAll = () => {
    setUploadFiles([])
    setStatus("idle")
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
      setUploadFiles([])
    } catch {
      toast.error("Something went wrong while uploading the file")
      setStatus("idle")
    }
  }

  return (
    <div className="w-full max-w-[760px] space-y-3">
      <FileUpload
        files={uploadFiles}
        onFileSelectChange={handleFileSelectChange}
        multiple={false}
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        maxSize={10}
        maxCount={1}
        disabled={status === "loading"}
      >
        <DropZone
          prompt="Click or drop one file to upload"
          className="rounded-[12px] border-[#c0c0c0] bg-[#f9f9f9] py-6"
        />
        <FileError autoHideDuration={4000} />
        <FileList onClear={handleClearAll} onRemove={handleRemove} canRemove />
      </FileUpload>

      <p className="text-[13px] tracking-[-0.2px] text-[#737373]">
        Supported files: CSV, XLSX, XLS. Required columns: Full name, Email, Department, Year, Roll no
      </p>

      <Button
        type="button"
        onClick={uploadStudentsFile}
        disabled={status === "loading" || !file}
        className="h-[44px] rounded-full border border-[#1e1f24] bg-[linear-gradient(180deg,#1e2027_0%,#14161b_100%)] px-5 text-[15px] font-semibold tracking-[-0.3px] text-white"
      >
        {status === "loading" ? "Uploading..." : "Upload Students File"}
      </Button>

      {status === "success" ? (
        <p className="text-[13px] font-medium tracking-[-0.2px] text-emerald-700">Upload completed successfully.</p>
      ) : null}
    </div>
  )
}
