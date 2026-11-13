import "server-only"

import { Resend } from "resend"

import { env } from "@/lib/env"

let client: Resend | null = null
function resend() {
  client ??= new Resend(env.RESEND_API_KEY)
  return client
}

export async function sendPasswordResetOtp(to: string, code: string) {
  const { error } = await resend().emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `${code} is your Keystore reset code`,
    text: `Your Keystore password reset code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p style="color:#555">Enter this code to reset your Keystore password:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
        <p style="color:#888;font-size:13px">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>`,
  })
  if (error) throw new Error(`Failed to send email: ${error.message}`)
}
