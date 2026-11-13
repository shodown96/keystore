"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { generateOtp, hashOtp, safeEqual } from "@/lib/crypto"
import { db } from "@/lib/db"
import { sendPasswordResetOtp } from "@/lib/email"
import { fakeVerify, hashPassword, verifyPassword } from "@/lib/password"
import { createSession, deleteSession } from "@/lib/session"
import { emailSchema, fieldErrors, passwordSchema, type FormState } from "@/lib/validation"

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 60 * 1000
const OTP_MAX_ATTEMPTS = 5

// ---------- Sign up ----------

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailSchema,
  password: passwordSchema,
})

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { name, email, password } = parsed.data
  const existing = await db.account.findUnique({ where: { email } })
  if (existing) {
    return {
      error: existing.passwordHash
        ? "An account with this email already exists."
        : "This email is registered with Google. Continue with Google, or use 'Forgot password' to set a password.",
    }
  }

  const account = await db.account.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  })
  await createSession(account)
  redirect("/dashboard")
}

// ---------- Sign in ----------

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { email, password } = parsed.data
  const account = await db.account.findUnique({ where: { email } })

  const valid = account?.passwordHash
    ? await verifyPassword(password, account.passwordHash)
    : await fakeVerify()

  if (!account || !valid) return { error: "Invalid email or password." }

  await createSession(account)
  redirect("/dashboard")
}

export async function signOut() {
  await deleteSession()
  redirect("/login")
}

// ---------- Forgot password (OTP) ----------

export type ResetState = FormState & { step?: "request" | "verify"; email?: string }

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = emailSchema.safeParse(formData.get("email"))
  if (!parsed.success) return { step: "request", fieldErrors: { email: [parsed.error.issues[0].message] } }

  const email = parsed.data
  const account = await db.account.findUnique({ where: { email } })

  if (account) {
    const recent = await db.verificationToken.findFirst({
      where: {
        accountId: account.id,
        purpose: "password_reset",
        createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
      },
    })

    if (!recent) {
      const code = generateOtp()
      await db.$transaction([
        db.verificationToken.deleteMany({ where: { accountId: account.id, purpose: "password_reset" } }),
        db.verificationToken.create({
          data: {
            accountId: account.id,
            purpose: "password_reset",
            token: hashOtp(code, account.id),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
          },
        }),
      ])
      try {
        await sendPasswordResetOtp(email, code)
      } catch (err) {
        console.error(err)
        return { step: "request", email, error: "We couldn't send the email. Try again shortly." }
      }
    }
  }

  // Same response whether or not the account exists.
  return {
    step: "verify",
    email,
    success: "If an account exists for that email, we've sent a 6-digit code.",
  }
}

const resetSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: passwordSchema,
})

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData))
  const email = String(formData.get("email") ?? "")
  if (!parsed.success) return { step: "verify", email, fieldErrors: fieldErrors(parsed.error) }

  const invalid: ResetState = { step: "verify", email, error: "That code is invalid or has expired." }

  const account = await db.account.findUnique({ where: { email: parsed.data.email } })
  if (!account) return invalid

  const token = await db.verificationToken.findFirst({
    where: {
      accountId: account.id,
      purpose: "password_reset",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })
  if (!token) return invalid

  if (token.attempts >= OTP_MAX_ATTEMPTS) {
    return { step: "request", email, error: "Too many attempts. Request a new code." }
  }

  if (!safeEqual(hashOtp(parsed.data.code, account.id), token.token)) {
    await db.verificationToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } })
    return invalid
  }

  const [, updated] = await db.$transaction([
    db.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    db.account.update({
      where: { id: account.id },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        tokenVersion: { increment: 1 }, // logs out every other session
      },
    }),
  ])

  await createSession(updated)
  redirect("/dashboard")
}
