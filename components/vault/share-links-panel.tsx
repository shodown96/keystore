"use client"

import { Eye, Link2, Lock, Plus, Trash2 } from "lucide-react"
import { useActionState, useState, useSyncExternalStore, useTransition } from "react"
import { toast } from "sonner"

import { createShareLink, deleteShareLink, revokeShareLink } from "@/app/(app)/vaults/actions"
import { FieldError, FormAlert } from "@/components/auth/auth-shell"
import { CopyButton } from "@/components/copy-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PasswordInput } from "@/components/password-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LinkStatus } from "@/lib/share-link"

export type LinkRow = {
  id: string
  label: string | null
  hasPassword: boolean
  expiresAt: string | null
  maxViews: number | null
  viewCount: number
  lastViewedAt: string | null
  createdAt: string
  status: LinkStatus
}

const STATUS_STYLES: Record<LinkStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  expired: { label: "Expired", variant: "secondary" },
  exhausted: { label: "View limit reached", variant: "secondary" },
  revoked: { label: "Revoked", variant: "outline" },
  locked: { label: "Locked", variant: "destructive" },
}

const IS_DEV = process.env.NODE_ENV === "development"

/** The current site's origin. */
function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  )
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export function ShareLinksPanel({ vaultId, links }: { vaultId: string; links: LinkRow[] }) {
  const [open, setOpen] = useState(false)
  // Re-mount the form each time the dialog opens so old state (and the one-time URL) is cleared.
  const [formKey, setFormKey] = useState(0)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Links give read-only access to this vault&apos;s current secrets and docs.
        </p>
        <Button
          onClick={() => {
            setFormKey((k) => k + 1)
            setOpen(true)
          }}
        >
          <Plus /> New link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          <Link2 className="size-8" />
          No share links yet.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {links.map((link) => {
            const s = STATUS_STYLES[link.status]
            return (
              <div key={link.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{link.label || "Untitled link"}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                    {link.hasPassword && <Lock className="size-3.5 text-muted-foreground" aria-label="Password protected" />}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Created {fmt(link.createdAt)}</span>
                    <span>{link.expiresAt ? `Expires ${fmt(link.expiresAt)}` : "Never expires"}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {link.viewCount}
                      {link.maxViews ? ` / ${link.maxViews}` : ""} views
                    </span>
                    {link.lastViewedAt && <span>Last opened {fmt(link.lastViewedAt)}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {link.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await revokeShareLink(link.id)
                          toast.success("Link revoked")
                        })
                      }
                    >
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete link"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteShareLink(link.id)
                        toast.success("Link deleted")
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-md">
          <CreateLinkForm key={formKey} vaultId={vaultId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateLinkForm({ vaultId, onDone }: { vaultId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState(createShareLink.bind(null, vaultId), undefined)

  if (state?.path) return <CreatedLink path={state.path} onDone={onDone} />

  return (
    <form action={action} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>New share link</DialogTitle>
        <DialogDescription>Send this to a client to give them read-only access.</DialogDescription>
      </DialogHeader>
      <FormAlert error={state?.error} />
      <div className="grid gap-2">
        <Label htmlFor="label">Label (only you see this)</Label>
        <Input id="label" name="label" placeholder="e.g. Acme dev team" maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password (optional)</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="Leave blank for no password" />
        <FieldError errors={state?.fieldErrors?.password} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="expiresIn">Expires</Label>
          <select
            id="expiresIn"
            name="expiresIn"
            defaultValue="7d"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="1h">In 1 hour</option>
            <option value="24h">In 24 hours</option>
            <option value="7d">In 7 days</option>
            <option value="30d">In 30 days</option>
            <option value="never">Never</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxViews">Max views</Label>
          <Input id="maxViews" name="maxViews" type="number" min={1} placeholder="Unlimited" />
          <FieldError errors={state?.fieldErrors?.maxViews} />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create link"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function normalizeDomain(input: string) {
  const trimmed = input.trim().replace(/\/+$/, "")
  if (!trimmed) return ""
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function CreatedLink({ path, onDone }: { path: string; onDone: () => void }) {
  const origin = useOrigin()
  // In dev the browser origin is localhost, which is useless to a client,
  // so let the user type the real domain before copying.
  const [domain, setDomain] = useState("")
  const base = IS_DEV ? normalizeDomain(domain) || origin : origin
  const url = `${base}${path}`

  return (
    <>
      <DialogHeader>
        <DialogTitle>Link created</DialogTitle>
        <DialogDescription>Copy it now. For security, the link can&apos;t be shown again.</DialogDescription>
      </DialogHeader>
      {IS_DEV && (
        <div className="grid gap-2">
          <Label htmlFor="domain">Domain for this link</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. keystore.yourdomain.com"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            You&apos;re in dev mode. Enter your deployed domain so the link works for your client, or
            leave blank to use {origin}.
          </p>
        </div>
      )}
      {/* min-w-0: as a grid child of the dialog, the row would otherwise grow to fit the URL. */}
      <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3">
        <code className="min-w-0 flex-1 truncate text-xs" title={url}>
          {url}
        </code>
        <CopyButton value={url} label="Copy link" />
      </div>
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </>
  )
}
