import { KeyRound, Link2, Plus, Vault } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAccount } from "@/lib/dal"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const account = await requireAccount()
  const now = new Date()

  const vaults = await db.vault.findMany({
    where: { ownerId: account.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: {
        select: {
          secrets: true,
          shareLinks: {
            where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          },
        },
      },
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Your vaults</h1>
          <p className="text-sm text-muted-foreground">
            Bundles of keys, env vars and docs you can share with clients.
          </p>
        </div>
        <Link href="/vaults/new" className={buttonVariants({ size: "lg" })}>
          <Plus /> New vault
        </Link>
      </div>

      {vaults.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Vault className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No vaults yet</p>
            <p className="text-sm text-muted-foreground">Create one to start storing secrets.</p>
          </div>
          <Link href="/vaults/new" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>
            <Plus /> Create vault
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((v) => (
            <Link key={v.id} href={`/vaults/${v.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="truncate">{v.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-10">
                    {v.description || "No description"}
                  </CardDescription>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <KeyRound className="size-3.5" /> {v._count.secrets} secrets
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="size-3.5" /> {v._count.shareLinks} active links
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
