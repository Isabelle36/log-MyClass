"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useRef, useState } from "react"

type TeacherRow = {
  id: string
  fullName: string
  email: string | null
  department: string
  userId: string
  user: {
    clerkUserId: string
    email: string | null
  }
}

const DEPARTMENTS = ["BBA", "BCA"]

type TeacherFilters = {
  q: string
  department: string
}

export default function AdminTeachersManager() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [q, setQ] = useState("")
  const [department, setDepartment] = useState("all")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TeacherRow | null>(null)
  const [deletePhraseInput, setDeletePhraseInput] = useState("")

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [hasLoadedTeachers, setHasLoadedTeachers] = useState(false)

  const teachersRequestRef = useRef(0)

  const deletePhrase = deleteTarget ? `DELETE ${deleteTarget.email}` : ""

  const fetchTeachers = async (filters?: Partial<TeacherFilters>) => {
    const requestId = ++teachersRequestRef.current
    setLoading(true)
    setError("")

    try {
      const url = new URL("/api/admin/teachers", window.location.origin)
      const query = filters?.q ?? q
      const selectedDepartment = filters?.department ?? department

      if (query.trim()) {
        url.searchParams.set("q", query.trim())
      }
      if (selectedDepartment !== "all") {
        url.searchParams.set("department", selectedDepartment)
      }

      const res = await fetch(url.toString())
      const data = (await res.json()) as {
        teachers?: TeacherRow[]
        error?: string
      }

      if (!res.ok) {
        if (requestId === teachersRequestRef.current) {
          setTeachers([])
          setError(data.error ?? "Failed to fetch teachers")
        }
        return
      }

      if (requestId === teachersRequestRef.current) {
        setTeachers(data.teachers ?? [])
      }
    } catch {
      if (requestId === teachersRequestRef.current) {
        setError("Failed to fetch teachers")
        setTeachers([])
      }
    } finally {
      if (requestId === teachersRequestRef.current) {
        setLoading(false)
        setHasLoadedTeachers(true)
      }
    }
  }

  const deleteTeacher = async () => {
    if (!deleteTarget) {
      return
    }

    if (deletePhraseInput.trim() !== deletePhrase) {
      setError("Delete phrase does not match. Please type the exact phrase.")
      return
    }

    setActionLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await fetch(`/api/admin/teachers/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Failed to delete teacher")
        return
      }

      setMessage("Teacher deleted successfully")
      setDeleteOpen(false)
      setDeleteTarget(null)
      setDeletePhraseInput("")
      await fetchTeachers()
    } catch {
      setError("Failed to delete teacher")
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (teacher: TeacherRow) => {
    setDeleteTarget(teacher)
    setDeletePhraseInput("")
    setDeleteOpen(true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTeachers({ q, department })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [q, department])

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 bg-linear-to-b from-white to-slate-50/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Management
            </p>
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
              All Teachers
            </CardTitle>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4">
              <Input
                placeholder="Search by name or email"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="border-slate-200 bg-white/85 text-slate-800 placeholder:text-slate-500 focus-visible:ring-blue-400 lg:col-span-2"
              />

              <div className="relative">
                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-9 w-full appearance-none rounded-4xl border border-slate-200 bg-white/85 px-3 pr-10 text-sm text-slate-800 outline-none transition focus-visible:border-blue-400 focus-visible:ring-[3px] focus-visible:ring-blue-200"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="flex min-h-7 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setQ("")
                  setDepartment("all")
                }}
              >
                Clear filters
              </Button>
              <p className="text-xs font-medium tracking-wide text-slate-500">
                {loading && hasLoadedTeachers ? "Updating results..." : `Showing ${teachers.length} teachers`}
              </p>
            </div>

            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          </div>
        </CardHeader>

        <CardContent>
          <div className="min-h-80 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700">Department</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`teachers-loading-${index}`}>
                      <TableCell>
                        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-8 w-24 animate-pulse rounded-full bg-slate-200/80" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No teachers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id} className="hover:bg-blue-50/35">
                      <TableCell className="font-medium text-slate-900">{teacher.fullName}</TableCell>
                      <TableCell className="font-medium text-slate-900">{teacher.email ?? "-"}</TableCell>
                      <TableCell className="text-slate-700">{teacher.department}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(teacher)}
                          disabled={actionLoading}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Danger Zone: Delete Teacher</DialogTitle>
            <DialogDescription>
              This permanently removes the teacher and all their associated sessions.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="space-y-2">
              <p className="text-sm text-red-700">Type the exact phrase to confirm deletion:</p>
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-900">
                {deletePhrase}
              </p>
              <Input
                value={deletePhraseInput}
                onChange={(event) => setDeletePhraseInput(event.target.value)}
                placeholder="Type confirmation phrase"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteTeacher()}
              disabled={deletePhraseInput.trim() !== deletePhrase || actionLoading}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
