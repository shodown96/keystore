"use client"

import { useActionState } from "react"

import { signUp } from "@/app/(auth)/actions"
import { FieldError, FormAlert, GoogleButton, OrDivider } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, undefined)

  return (
    <>
      <GoogleButton />
      <OrDivider />
      <form action={action} className="flex flex-col gap-4">
        <FormAlert error={state?.error} />
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
          <FieldError errors={state?.fieldErrors?.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          <FieldError errors={state?.fieldErrors?.email} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
          <FieldError errors={state?.fieldErrors?.password} />
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </>
  )
}
