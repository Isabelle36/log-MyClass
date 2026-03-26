import { AnimatedBanner } from "@/components/ui/animated-banner"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import ScanAttendanceClient from "./ScanAttendanceClient"

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string | string[] }>
}) {
  await requireRole("STUDENT")

  const { userId } = await auth()

  const studentUser = userId
    ? await prisma.user.findUnique({
        where: { clerkUserId: userId },
        select: {
          student: {
            select: {
              isActive: true,
            },
          },
        },
      })
    : null

  if (!studentUser?.student?.isActive) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-xl">
          <AnimatedBanner 
            variant="default"
            title="Scan Attendance"
            description={
              <>
                <p>
                  Your account is currently restricted. You cannot make attendance until your
                  dean or coordinator reactivates your account. Please contact them for assistance.
                </p>
                <div className="mt-4">
                  <Link href="/student" className="text-sm font-medium text-blue-900 underline-offset-4 hover:underline">
                    Back to Student Dashboard
                  </Link>
                </div>
              </>
            }
          />
        </div>
      </div>
    )
  }

  const params = await searchParams
  const sessionParam = params.sessionId
  const sessionId = Array.isArray(sessionParam) ? sessionParam[0] : sessionParam

  if (!sessionId) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="mx-auto max-w-xl">
          <AnimatedBanner 
            variant="default"
            title="Scan Attendance"
            description={
              <>
                <p>Use the QR code shared by your teacher during class to continue.</p>
                <div className="mt-4">
                  <Link href="/student" className="text-sm font-medium text-blue-900 underline-offset-4 hover:underline">
                    Back to Student Dashboard
                  </Link>
                </div>
              </>
            }
          />
        </div> 
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <ScanAttendanceClient sessionId={sessionId} />
    </div>
  )
}

