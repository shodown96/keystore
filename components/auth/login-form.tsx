"use client"

import Link from "next/link"
import { useActionState } from "react"

import { signIn } from "@/app/(auth)/actions"
import { FieldError, FormAlert, GoogleButton, OrDivider } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <>
      <GoogleButton />
      <OrDivider />
      <form action={action} className="flex flex-col gap-4">
        <FormAlert error={state?.error ?? oauthError} />
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          <FieldError errors={state?.fieldErrors?.email} />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" name="password" autoComplete="current-password" required />
          <FieldError errors={state?.fieldErrors?.password} />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </>
  )
}
