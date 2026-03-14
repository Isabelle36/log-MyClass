export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is not assigned to this institution yet.
        </p>
        <p className="text-sm text-muted-foreground">
          Ask an admin to send you an invite.
        </p>
      </div>
    </div>
  )
}
