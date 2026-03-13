import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { syncUserWithDatabase } from "@/lib/auth/sync-user"

type AttemptBucket = {
  count: number
  resetAt: number
}

const globalForSetupRateLimit = globalThis as unknown as {
  setupRateLimitStore: Map<string, AttemptBucket> | undefined
}

const setupRateLimitStore =
  globalForSetupRateLimit.setupRateLimitStore ?? new Map<string, AttemptBucket>()

if (!globalForSetupRateLimit.setupRateLimitStore) {
  globalForSetupRateLimit.setupRateLimitStore = setupRateLimitStore
}

function parseEnvInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const isProd = process.env.NODE_ENV === "production"
const setupRateLimitEnabled =
  process.env.SETUP_RATE_LIMIT_ENABLED === undefined
    ? true
    : process.env.SETUP_RATE_LIMIT_ENABLED === "true"
const setupRateLimitWindowMs = parseEnvInt(
  process.env.SETUP_RATE_LIMIT_WINDOW_MS,
  isProd ? 10 * 60 * 1000 : 60 * 1000
)
const setupRateLimitMaxAttempts = parseEnvInt(
  process.env.SETUP_RATE_LIMIT_MAX_ATTEMPTS,
  isProd ? 5 : 30
)

function getAttemptBucket(key: string) {
  const now = Date.now()
  const current = setupRateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + setupRateLimitWindowMs }
    setupRateLimitStore.set(key, fresh)
    return fresh
  }

  return current
}

function getRetryAfterSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
}

function getRateLimitKey(req: Request, userId: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  return `${userId}:${ip}`
}

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const setupKey = typeof body?.setupKey === "string" ? body.setupKey : ""

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId }
  })

  if (existingUser) {
    return NextResponse.json(existingUser)
  }

  const adminExists = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  // Post-bootstrap flow: only invited users (via Clerk metadata) can sync.
  if (adminExists) {
    const syncResult = await syncUserWithDatabase({ clerkUserId: userId })

    if (!syncResult.user) {
      return NextResponse.json(
        { error: "This account is not invited for this institution." },
        { status: 403 }
      )
    }

    return NextResponse.json(syncResult.user)
  }

  const adminSetupKeyHash = process.env.ADMIN_SETUP_KEY_HASH
    ?.trim()
    .replace(/^['\"]|['\"]$/g, "")
  if (!adminSetupKeyHash) {
    return NextResponse.json(
      { error: "Server missing ADMIN_SETUP_KEY_HASH" },
      { status: 500 }
    )
  }

  const isBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(adminSetupKeyHash)
  if (!isBcryptHash) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured ADMIN_SETUP_KEY_HASH. Escape '$' as '\\$' in .env and restart the server."
      },
      { status: 500 }
    )
  }

  const rateLimitKey = getRateLimitKey(req, userId)

  if (setupRateLimitEnabled) {
    const bucket = getAttemptBucket(rateLimitKey)
    if (bucket.count >= setupRateLimitMaxAttempts) {
      const retryAfter = getRetryAfterSeconds(bucket.resetAt)
      return NextResponse.json(
        {
          error: "Too many attempts. Try again later.",
          retryAfter
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter)
          }
        }
      )
    }
  }

  const isValidSetupKey = await bcrypt.compare(setupKey.trim(), adminSetupKeyHash)

  if (!isValidSetupKey) {
    if (setupRateLimitEnabled) {
      const bucket = getAttemptBucket(rateLimitKey)
      bucket.count += 1
      setupRateLimitStore.set(rateLimitKey, bucket)
    }

    return NextResponse.json(
      { error: "Invalid setup key" },
      { status: 403 }
    )
  }

  if (setupRateLimitEnabled) {
    setupRateLimitStore.delete(rateLimitKey)
  }

  const adminAlreadyCreated = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  })

  if (adminAlreadyCreated) {
    return NextResponse.json(
      { error: "An admin account already exists" },
      { status: 403 }
    )
  }

const user = await prisma.user.create({
  data: {
    clerkUserId: userId,
    role: "ADMIN"
  }
})

  return NextResponse.json(user)
}