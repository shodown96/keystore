// Edge/proxy-safe JWT helpers (no server-only / next/headers imports).
import { jwtVerify, SignJWT, type JWTPayload } from "jose"

export const SESSION_COOKIE = "ks_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export type SessionPayload = JWTPayload & { sub: string; tv: number }
export type LinkAccessPayload = JWTPayload & { lid: string }

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error("Missing required environment variable: AUTH_SECRET")
  return new TextEncoder().encode(value)
}

export async function signJwt(payload: JWTPayload, ttlSeconds: number, audience: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience(audience)
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret())
}

export async function verifyJwt<T extends JWTPayload>(
  token: string | undefined,
  audience: string
): Promise<T | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      audience,
    })
    return payload as T
  } catch {
    return null
  }
}
