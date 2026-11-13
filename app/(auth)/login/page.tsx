import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

const OAUTH_ERRORS: Record<string, string> = {
  google_state: "Google sign-in expired. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
  google_no_email: "Your Google account has no email address.",
  google_unverified: "Your Google email isn't verified, so we can't link it to the existing account.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to manage your vaults."
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm oauthError={error ? (OAUTH_ERRORS[error] ?? "Sign-in failed.") : undefined} />
    </AuthShell>
  )
}
