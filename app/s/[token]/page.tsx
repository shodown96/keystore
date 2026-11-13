import type { JSONContent } from "@tiptap/react"
import { LinkIcon } from "lucide-react"
import type { Metadata } from "next"

import { Logo } from "@/components/logo"
import { ShareGate } from "@/components/share/share-gate"
import { SharedVaultView } from "@/components/share/shared-vault-view"
import { decrypt, sha256 } from "@/lib/crypto"
import { db } from "@/lib/db"
import { hasLinkAccess, LINK_ACCESS_TTL_SECONDS } from "@/lib/session"
import { getLinkStatus } from "@/lib/share-link"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Shared vault · Keystore",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function SharedVaultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const link = await db.shareLink.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      vault: {
        include: {
          secrets: { orderBy: { position: "asc" } },
          owner: { select: { name: true } },
        },
      },
    },
  })

  const status = link ? getLinkStatus(link) : null
  const access = link ? await hasLinkAccess(link.id) : false

  // A visitor who already opened the link keeps access for the session even if
  // that open used up the last view. Revoked/expired/locked always wins.
  const usable = status === "active" || (status === "exhausted" && access)
  const showVault = !!link && usable && access

  const notes = link?.vault.notesEnc ? (JSON.parse(decrypt(link.vault.notesEnc)) as JSONContent) : null
  const hasDocs = !!notes?.content?.some((n) => n.content?.length || n.type !== "paragraph")

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main
        className={cn(
          "mx-auto w-full max-w-3xl flex-1 px-4 py-10",
          // Gate and error states sit in the middle of the screen; the vault view flows from the top.
          !showVault && "flex items-center justify-center pb-24"
        )}
      >
        {!link || !usable ? (
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <LinkIcon className="size-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-xl font-semibold">Link unavailable</h1>
            <p className="text-sm text-muted-foreground">
              This link has expired, been revoked, reached its view limit, or doesn&apos;t exist. Ask
              the person who sent it for a new one.
            </p>
          </div>
        ) : !access ? (
          <ShareGate
            token={token}
            vaultName={link.vault.name}
            vaultDescription={link.vault.description}
            sharedBy={link.vault.owner.name}
            hasPassword={!!link.passwordHash}
            secretCount={link.vault.secrets.length}
            hasDocs={hasDocs}
            expiresAt={link.expiresAt?.toISOString() ?? null}
            viewsLeft={link.maxViews !== null ? Math.max(link.maxViews - link.viewCount, 0) : null}
            sessionMinutes={LINK_ACCESS_TTL_SECONDS / 60}
          />
        ) : (
          <SharedVaultView
            name={link.vault.name}
            description={link.vault.description}
            secrets={link.vault.secrets.map((s) => ({ key: s.key, value: decrypt(s.valueEnc), note: s.note }))}
            notes={notes}
            expiresAt={link.expiresAt?.toISOString() ?? null}
            sessionMinutes={LINK_ACCESS_TTL_SECONDS / 60}
          />
        )}
      </main>
    </div>
  )
}
