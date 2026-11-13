import "server-only"

import { Google } from "arctic"

import { env } from "@/lib/env"

export const GOOGLE_STATE_COOKIE = "ks_google_state"
export const GOOGLE_VERIFIER_COOKIE = "ks_google_verifier"

export function google() {
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.APP_URL}/api/auth/google/callback`
  )
}

export type GoogleClaims = {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}
