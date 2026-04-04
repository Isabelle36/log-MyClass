"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CircleAlert, FileText, Image, Pause, Play, Trash, Upload, X } from "lucide-react"

import { cn, generateUniqueId } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  file: File
  progress: number
  status: FileStatus
  error?: string
}

export enum FileStatus {
  Uploading,
  Paused,
  Completed,
  Error,
  Cancelled,
  Pending,
}

interface FileUploadContextType {
  files: FileInfo[]
  error: string | null
  setError: (error: string | null) => void
  maxCount?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  validateFiles: (files: File[]) => { valid: boolean; errorMessage?: string }
  onFileSelect?: (files: File[]) => void
  onFileSelectChange?: (files: FileInfo[]) => void
  onUpload?: () => void
  onPause?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  disabled?: boolean
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export function useFileUpload() {
  const context = useContext(FileUploadContext)
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploadProvider")
  }
  return context
}

export interface FileErrorProps {
  message?: string
  onClose?: () => void
  className?: string
  autoHideDuration?: number
}

export function FileError({ message, onClose, className, autoHideDuration }: FileErrorProps) {
  const { error, setError } = useFileUpload()
  const displayMessage = message || error

  useEffect(() => {
    if (!displayMessage || !autoHideDuration) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setError(null)
      onClose?.()
    }, autoHideDuration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [displayMessage, autoHideDuration, onClose, setError])

  if (!displayMessage) {
    return null
  }

  const handleClose = () => {
    setError(null)
    onClose?.()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4" />
          <p className="text-sm">{displayMessage}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-destructive/20"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function FileTypeIcon({ type }: { type: string }) {
  if (type.includes("image")) {
    return <Image className="h-4 w-4" />
  }

  return <FileText className="h-4 w-4" />
}

export interface FileProgressProps {
  progress?: number
  status?: FileInfo["status"]
  fileId?: string
  className?: string
}

export function FileProgress({ progress, status, fileId, className }: FileProgressProps) {
  const { files } = useFileUpload()

  let fileStatus = status
  let fileProgress = progress

  if (fileId) {
    const file = files.find((entry) => entry.id === fileId)
    if (file) {
      fileStatus = file.status
      fileProgress = file.progress
    }
  }

  if (fileStatus === undefined || fileProgress === undefined || fileStatus === FileStatus.Completed) {
    return null
  }

  return (
    <div className={cn("mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          fileStatus === FileStatus.Error
            ? "bg-destructive"
            : fileStatus === FileStatus.Paused
              ? "bg-amber-500"
              : "bg-primary",
        )}
        style={{ width: `${fileProgress}%` }}
      />
    </div>
  )
}

export interface FileItemProps {
  file?: FileInfo
  fileId?: string
  onPause?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  className?: string
  canResume?: boolean
  canRemove?: boolean
  showProgress?: boolean
}

export function FileItem({
  file: propFile,
  fileId,
  onPause,
  onResume,
  onRemove,
  className,
  canResume = false,
  canRemove = true,
  showProgress = false,
}: FileItemProps) {
  const { files } = useFileUpload()

  const file = useMemo(() => {
    if (propFile) {
      return propFile
    }
    if (!fileId) {
      return undefined
    }
    return files.find((entry) => entry.id === fileId)
  }, [propFile, fileId, files])

  if (!file) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-md border bg-background p-3 shadow-sm", className)}>
      <div className="flex-shrink-0">
        <FileTypeIcon type={file.type} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          {file.status === FileStatus.Error && (
            <span className="ml-2 text-destructive">{file.error || "Failed to upload"}</span>
          )}
        </p>

        {showProgress ? <FileProgress progress={file.progress} status={file.status} /> : null}
      </div>

      {canResume ? (
        <div className="flex items-center gap-1">
          {file.status === FileStatus.Uploading ? (
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPause?.(file.id)}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : null}
          {file.status === FileStatus.Paused ? (
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onResume?.(file.id)}>
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {canRemove ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove?.(file.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

export interface FileListProps {
  files?: FileInfo[]
  onPause?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  onClear?: () => void
  showUploadButton?: boolean
  className?: string
  canResume?: boolean
  canRemove?: boolean
}

export function FileList({
  files: propFiles,
  onPause,
  onResume,
  onRemove,
  onClear,
  showUploadButton = false,
  className,
  canResume,
  canRemove,
}: FileListProps) {
  const { files: contextFiles, onUpload } = useFileUpload()
  const files = propFiles || contextFiles

  if (files.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Selected Files</h3>
        <div className="flex gap-2">
          {showUploadButton && files.some((file) => file.status === FileStatus.Pending) ? (
            <Button size="sm" type="button" onClick={onUpload}>
              Start Upload
            </Button>
          ) : null}
          <Button size="sm" type="button" variant="outline" onClick={onClear}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onPause={onPause}
            onResume={onResume}
            onRemove={onRemove}
            canResume={canResume}
            canRemove={canRemove}
          />
        ))}
      </div>
    </div>
  )
}

export interface DropZoneProps {
  onFileSelect?: (files: File[]) => void
  prompt?: string
  maxSize?: number
  maxCount?: number
  multiple?: boolean
  accept?: string
  className?: string
  onError?: (message: string) => void
}

export function DropZone({
  onFileSelect: propOnFileSelect,
  prompt = "click or drop to upload file",
  maxSize: propMaxSize,
  multiple: propMultiple,
  accept: propAccept,
  className,
  onError: propOnError,
}: DropZoneProps) {
  const {
    disabled,
    files: contextFiles,
    maxSize: contextMaxSize,
    multiple: contextMultiple,
    accept: contextAccept,
    setError,
    onFileSelect: contextOnFileSelect,
    onFileSelectChange,
    validateFiles,
  } = useFileUpload()

  const maxSize = propMaxSize || contextMaxSize
  const multiple = propMultiple !== undefined ? propMultiple : contextMultiple
  const accept = propAccept || contextAccept
  const onFileSelect = propOnFileSelect || contextOnFileSelect
  const onError = propOnError || setError

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (fileInputRef.current && contextFiles.length === 0) {
      fileInputRef.current.value = ""
    }
  }, [contextFiles])

  const toFileInfos = (files: File[]): FileInfo[] => {
    return files.map((file) => ({
      id: generateUniqueId(file.name),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      file,
      status: FileStatus.Pending,
    }))
  }

  const handleFiles = (incomingFiles: File[]) => {
    const validation = validateFiles(incomingFiles)

    if (!validation.valid) {
      if (validation.errorMessage) {
        onError(validation.errorMessage)
      }
      return
    }

    setError(null)
    onFileSelect?.(incomingFiles)
    onFileSelectChange?.(toFileInfos(incomingFiles))
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(Array.from(event.dataTransfer.files))
    }
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(Array.from(event.target.files))
    }
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        className,
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Upload className="h-5 w-5" />
      <p className="text-sm text-muted-foreground">{prompt}</p>
      {maxSize ? <p className="text-xs text-muted-foreground">File max cannot exceed {maxSize} MB</p> : null}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
    </div>
  )
}

export interface FileUploadProviderProps {
  children: React.ReactNode
  files?: FileInfo[]
  multiple?: boolean
  accept?: string
  maxCount?: number
  maxSize?: number
  onFileSelect?: (files: File[]) => void
  onFileSelectChange?: (files: FileInfo[]) => void
  onUpload?: () => void
  onPause?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  disabled?: boolean
}

export function FileUploadProvider({
  children,
  files = [],
  multiple = false,
  accept,
  maxCount = 1,
  maxSize = 1,
  onFileSelect,
  onFileSelectChange,
  onUpload,
  onPause,
  onResume,
  onRemove,
  disabled = false,
}: FileUploadProviderProps) {
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (incomingFiles: File[]): { valid: boolean; errorMessage?: string } => {
    if (maxCount && incomingFiles.length > maxCount) {
      return {
        valid: false,
        errorMessage: `You can upload a maximum of ${maxCount} file(s).`,
      }
    }

    if (maxSize) {
      const oversizedFiles = incomingFiles.filter((file) => file.size > maxSize * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((file) => file.name).join(", ")
        return {
          valid: false,
          errorMessage: `File size exceeds ${maxSize} MB: ${fileNames}`,
        }
      }
    }

    if (accept) {
      const acceptedTypes = accept.split(",").map((type) => type.trim().toLowerCase())
      const invalidFiles = incomingFiles.filter((file) => {
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`
        const mimeType = file.type.toLowerCase()

        return !acceptedTypes.some((acceptedType) => {
          if (acceptedType.includes("/*")) {
            return mimeType.startsWith(acceptedType.replace("/*", "/"))
          }

          return acceptedType === fileExtension || acceptedType === mimeType
        })
      })

      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map((file) => file.name).join(", ")
        return {
          valid: false,
          errorMessage: `Unsupported file type: ${fileNames}`,
        }
      }
    }

    return { valid: true }
  }

  return (
    <FileUploadContext.Provider
      value={{
        files,
        error,
        setError,
        maxCount,
        maxSize,
        accept,
        multiple,
        validateFiles,
        onFileSelect,
        onFileSelectChange,
        onUpload,
        onPause,
        onResume,
        onRemove,
        disabled,
      }}
    >
      {children}
    </FileUploadContext.Provider>
  )
}

export interface FileUploadProps extends FileUploadProviderProps {
  className?: string
}

export default function FileUpload({ className, children, disabled, ...providerProps }: FileUploadProps) {
  return (
    <FileUploadProvider {...providerProps} disabled={disabled}>
      <div className={cn("flex flex-1 flex-col space-y-4", className, disabled && "cursor-not-allowed opacity-50")}>
        {children}
      </div>
    </FileUploadProvider>
  )
}
