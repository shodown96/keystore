"use client"

import { useActionState, useState } from "react"

import { requestPasswordReset, resetPassword, type ResetState } from "@/app/(auth)/actions"
import { FieldError, FormAlert } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

// One state machine for both steps: intent decides which server action runs.
async function forgotPasswordAction(prev: ResetState, formData: FormData): Promise<ResetState> {
  const intent = formData.get("intent")
  if (intent === "back") return { step: "request", email: prev?.email }
  if (intent === "reset") return resetPassword(prev, formData)
  return requestPasswordReset(prev, formData)
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, { step: "request" })
  const [code, setCode] = useState("")

  if (state?.step === "verify") {
    return (
      <form action={action} className="flex flex-col gap-4">
        <FormAlert error={state.error} success={state.error ? undefined : state.success} />
        <input type="hidden" name="email" value={state.email ?? ""} />
        <div className="grid gap-2">
          <Label>6-digit code sent to {state.email}</Label>
          <InputOTP maxLength={6} name="code" value={code} onChange={setCode} autoComplete="one-time-code">
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="size-10 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <FieldError errors={state.fieldErrors?.code} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
          <FieldError errors={state.fieldErrors?.password} />
        </div>
        <Button type="submit" name="intent" value="reset" size="lg" disabled={pending}>
          {pending ? "Please wait…" : "Reset password"}
        </Button>
        <div className="flex justify-between">
          <Button type="submit" name="intent" value="back" variant="link" size="sm" formNoValidate className="px-0">
            Use a different email
          </Button>
          <Button type="submit" name="intent" value="resend" variant="link" size="sm" formNoValidate className="px-0" disabled={pending}>
            Resend code
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert error={state?.error} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
        <FieldError errors={state?.fieldErrors?.email} />
      </div>
      <Button type="submit" name="intent" value="request" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset code"}
      </Button>
    </form>
  )
}
