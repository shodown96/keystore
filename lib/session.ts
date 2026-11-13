import "server-only"

import { cookies } from "next/headers"

import { env } from "@/lib/env"
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signJwt,
  verifyJwt,
  type LinkAccessPayload,
  type SessionPayload,
} from "@/lib/jwt"

const SESSION_AUD = "session"
const LINK_AUD = "share-link"
export const LINK_ACCESS_TTL_SECONDS = 60 * 15

export async function createSession(account: { id: string; tokenVersion: number }) {
  const token = await signJwt({ sub: account.id, tv: account.tokenVersion }, SESSION_TTL_SECONDS, SESSION_AUD)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const payload = await verifyJwt<SessionPayload>(store.get(SESSION_COOKIE)?.value, SESSION_AUD)
  if (!payload?.sub || typeof payload.tv !== "number") return null
  return payload
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

// ---- Share link access (set after the visitor passes the gate) ----

function linkCookieName(linkId: string) {
  return `ks_link_${linkId}`
}

export async function grantLinkAccess(linkId: string, token: string) {
  const jwt = await signJwt({ lid: linkId }, LINK_ACCESS_TTL_SECONDS, LINK_AUD)
  const store = await cookies()
  store.set(linkCookieName(linkId), jwt, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: `/s/${token}`,
    maxAge: LINK_ACCESS_TTL_SECONDS,
  })
}

export async function hasLinkAccess(linkId: string): Promise<boolean> {
  const store = await cookies()
  const payload = await verifyJwt<LinkAccessPayload>(store.get(linkCookieName(linkId))?.value, LINK_AUD)
  return payload?.lid === linkId
}
