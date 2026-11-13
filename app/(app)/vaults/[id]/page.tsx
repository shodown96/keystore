import type { JSONContent } from "@tiptap/react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotesEditor } from "@/components/vault/notes-editor"
import { SecretsEditor } from "@/components/vault/secrets-editor"
import { ShareLinksPanel, type LinkRow } from "@/components/vault/share-links-panel"
import { VaultSettings } from "@/components/vault/vault-settings"
import { decrypt } from "@/lib/crypto"
import { requireAccount } from "@/lib/dal"
import { db } from "@/lib/db"
import { getLinkStatus } from "@/lib/share-link"

export default async function VaultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const account = await requireAccount()

  const vault = await db.vault.findFirst({
    where: { id, ownerId: account.id },
    include: {
      secrets: { orderBy: { position: "asc" } },
      shareLinks: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!vault) notFound()

  const secrets = vault.secrets.map((s) => ({ key: s.key, value: decrypt(s.valueEnc), note: s.note }))
  const notes = vault.notesEnc ? (JSON.parse(decrypt(vault.notesEnc)) as JSONContent) : null
  const links: LinkRow[] = vault.shareLinks.map((l) => ({
    id: l.id,
    label: l.label,
    hasPassword: !!l.passwordHash,
    expiresAt: l.expiresAt?.toISOString() ?? null,
    maxViews: l.maxViews,
    viewCount: l.viewCount,
    lastViewedAt: l.lastViewedAt?.toISOString() ?? null,
    createdAt: l.createdAt.toISOString(),
    status: getLinkStatus(l),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All vaults
        </Link>
        <h1 className="font-heading text-2xl font-semibold">{vault.name}</h1>
        {vault.description && <p className="text-sm text-muted-foreground">{vault.description}</p>}
      </div>

      <Tabs defaultValue="secrets">
        <TabsList>
          <TabsTrigger value="secrets">Secrets ({secrets.length})</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
          <TabsTrigger value="share">Share links ({links.filter((l) => l.status === "active").length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="secrets" className="pt-4">
          <SecretsEditor vaultId={vault.id} vaultName={vault.name} initial={secrets} />
        </TabsContent>
        <TabsContent value="docs" className="pt-4">
          <NotesEditor vaultId={vault.id} initial={notes} />
        </TabsContent>
        <TabsContent value="share" className="pt-4">
          <ShareLinksPanel vaultId={vault.id} links={links} />
        </TabsContent>
        <TabsContent value="settings" className="pt-4">
          <VaultSettings vaultId={vault.id} name={vault.name} description={vault.description} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
