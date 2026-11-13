import { decodeIdToken } from "arctic"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"

import { db } from "@/lib/db"
import { env } from "@/lib/env"
import {
  google,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  type GoogleClaims,
} from "@/lib/google"
import { createSession } from "@/lib/session"

function fail(reason: string) {
  return Response.redirect(`${env.APP_URL}/login?error=${encodeURIComponent(reason)}`, 302)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")

  const store = await cookies()
  const storedState = store.get(GOOGLE_STATE_COOKIE)?.value
  const codeVerifier = store.get(GOOGLE_VERIFIER_COOKIE)?.value
  store.delete(GOOGLE_STATE_COOKIE)
  store.delete(GOOGLE_VERIFIER_COOKIE)

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return fail("google_state")
  }

  let claims: GoogleClaims
  try {
    const tokens = await google().validateAuthorizationCode(code, codeVerifier)
    claims = decodeIdToken(tokens.idToken()) as GoogleClaims
  } catch (err) {
    console.error("Google OAuth failed", err)
    return fail("google_failed")
  }

  if (!claims.email) return fail("google_no_email")
  const email = claims.email.toLowerCase()

  let account = await db.account.findUnique({ where: { googleId: claims.sub } })

  if (!account) {
    const byEmail = await db.account.findUnique({ where: { email } })
    if (byEmail) {
      // Only auto-link when Google vouches for the email address.
      if (!claims.email_verified) return fail("google_unverified")
      account = await db.account.update({
        where: { id: byEmail.id },
        data: {
          googleId: claims.sub,
          avatarUrl: byEmail.avatarUrl ?? claims.picture,
          name: byEmail.name ?? claims.name,
        },
      })
    } else {
      account = await db.account.create({
        data: {
          email,
          googleId: claims.sub,
          name: claims.name,
          avatarUrl: claims.picture,
        },
      })
    }
  }

  await createSession(account)
  return Response.redirect(`${env.APP_URL}/dashboard`, 302)
}
