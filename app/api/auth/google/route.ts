import { generateCodeVerifier, generateState } from "arctic"
import { cookies } from "next/headers"

import { env } from "@/lib/env"
import { google, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE } from "@/lib/google"

export async function GET() {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const url = google().createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"])
  url.searchParams.set("prompt", "select_account")

  const store = await cookies()
  const opts = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  }
  store.set(GOOGLE_STATE_COOKIE, state, opts)
  store.set(GOOGLE_VERIFIER_COOKIE, codeVerifier, opts)

  return Response.redirect(url.toString(), 302)
}
