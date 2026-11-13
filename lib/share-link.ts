import type { ShareLink } from "@/lib/generated/prisma/client"

export const MAX_LINK_PASSWORD_ATTEMPTS = 10

export type LinkStatus = "active" | "revoked" | "expired" | "exhausted" | "locked"

export function getLinkStatus(link: ShareLink, now = new Date()): LinkStatus {
  if (link.revokedAt) return "revoked"
  if (link.expiresAt && link.expiresAt <= now) return "expired"
  if (link.failedAttempts >= MAX_LINK_PASSWORD_ATTEMPTS) return "locked"
  if (link.maxViews !== null && link.viewCount >= link.maxViews) return "exhausted"
  return "active"
}

export const EXPIRY_OPTIONS = {
  "1h": 60 * 60,
  "24h": 60 * 60 * 24,
  "7d": 60 * 60 * 24 * 7,
  "30d": 60 * 60 * 24 * 30,
  never: null,
} as const

export type ExpiryOption = keyof typeof EXPIRY_OPTIONS
