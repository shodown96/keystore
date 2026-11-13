import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { readSession } from "@/lib/session"

export const getCurrentAccount = cache(async () => {
  const session = await readSession()
  if (!session) return null

  const account = await db.account.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      tokenVersion: true,
      passwordHash: true,
      googleId: true,
    },
  })

  if (!account || account.tokenVersion !== session.tv) return null

  const { passwordHash, googleId, ...rest } = account
  return { ...rest, hasPassword: !!passwordHash, hasGoogle: !!googleId }
})

export type CurrentAccount = NonNullable<Awaited<ReturnType<typeof getCurrentAccount>>>

export async function requireAccount(): Promise<CurrentAccount> {
  const account = await getCurrentAccount()
  if (!account) {
    // A signed-but-stale cookie would loop with proxy.ts, so clear it first.
    redirect((await readSession()) ? "/api/auth/signout" : "/login")
  }
  return account
}

/** Loads a vault only if it belongs to the account; 404s otherwise. */
export async function getOwnedVault(vaultId: string, accountId: string) {
  return db.vault.findFirst({ where: { id: vaultId, ownerId: accountId } })
}
