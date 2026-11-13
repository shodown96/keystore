import "server-only"

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto"

import { env } from "@/lib/env"

const ALGO = "aes-256-gcm"

function encryptionKey() {
  const key = Buffer.from(env.ENCRYPTION_KEY, "base64")
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes, base64 encoded")
  }
  return key
}

/** Encrypts a string. Output format: iv.tag.ciphertext (base64url). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, ciphertext].map((b) => b.toString("base64url")).join(".")
}

export function decrypt(payload: string): string {
  const [iv, tag, ciphertext] = payload.split(".").map((p) => Buffer.from(p, "base64url"))
  const decipher = createDecipheriv(ALGO, encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url")
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

/** Keyed hash so a leaked DB can't be brute-forced over the 10^6 code space. */
export function hashOtp(code: string, accountId: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(`otp:${accountId}:${code}`).digest("hex")
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}
