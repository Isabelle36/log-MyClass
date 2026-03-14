import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  )
}