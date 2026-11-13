"use server"

import { redirect } from "next/navigation"

import { sha256 } from "@/lib/crypto"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import { grantLinkAccess } from "@/lib/session"
import { getLinkStatus, MAX_LINK_PASSWORD_ATTEMPTS } from "@/lib/share-link"
import type { FormState } from "@/lib/validation"

const UNAVAILABLE = "This link is no longer available."

/**
 * The gate every visitor passes through (password or a "reveal" click).
 * Counting views here, not on page render, means link previews (Slack, iMessage)
 * and refreshes don't burn views.
 */
export async function openShareLink(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const link = await db.shareLink.findUnique({ where: { tokenHash: sha256(token) } })
  if (!link || getLinkStatus(link) !== "active") return { error: UNAVAILABLE }

  if (link.passwordHash) {
    const password = String(formData.get("password") ?? "")
    if (!password || !(await verifyPassword(password, link.passwordHash))) {
      const updated = await db.shareLink.update({
        where: { id: link.id },
        data: { failedAttempts: { increment: 1 } },
      })
      const left = MAX_LINK_PASSWORD_ATTEMPTS - updated.failedAttempts
      return {
        error:
          left > 0
            ? `Incorrect password. ${left} attempt${left === 1 ? "" : "s"} left.`
            : "Too many incorrect attempts. This link is now locked.",
      }
    }
  }

  // Atomic view-limit check so two simultaneous opens can't exceed maxViews.
  const { count } = await db.shareLink.updateMany({
    where: {
      id: link.id,
      revokedAt: null,
      ...(link.maxViews !== null ? { viewCount: { lt: link.maxViews } } : {}),
    },
    data: { viewCount: { increment: 1 }, lastViewedAt: new Date(), failedAttempts: 0 },
  })
  if (count === 0) return { error: UNAVAILABLE }

  await grantLinkAccess(link.id, token)
  redirect(`/s/${token}`)
}
