"use client"

import { useState } from "react"

export default function SetupForm() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const setupKey = formData.get("setupKey")

    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ setupKey }),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)

      if (res.status === 429) {
        const retryAfter = payload?.retryAfter
        setError(
          retryAfter
            ? `Too many attempts. Try again in ${retryAfter}s.`
            : "Too many attempts. Try again later."
        )
      } else {
        setError(payload?.error ?? "Access denied. Contact your institution administrator.")
      }
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>First time setup</h2>

      <input
        name="setupKey"
        placeholder="Admin setup key"
        required
      />

      <button disabled={loading}>
        {loading ? "Checking..." : "Continue"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </form>
  )
}