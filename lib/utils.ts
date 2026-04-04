import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueId(seed?: string) {
  const base =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  if (!seed) {
    return base
  }

  const normalizedSeed = seed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
  return normalizedSeed ? `${normalizedSeed}-${base}` : base
}
