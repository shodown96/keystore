"use client"

import { Clock, Eye, FileText, KeyRound, Lock, ShieldCheck, Timer } from "lucide-react"
import { useActionState } from "react"

import { openShareLink } from "@/app/s/[token]/actions"
import { FormAlert } from "@/components/auth/auth-shell"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export type ShareGateProps = {
  token: string
  vaultName: string
  vaultDescription: string | null
  sharedBy: string | null
  hasPassword: boolean
  secretCount: number
  hasDocs: boolean
  expiresAt: string | null
  viewsLeft: number | null
  sessionMinutes: number
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export function ShareGate({
  token,
  vaultName,
  vaultDescription,
  sharedBy,
  hasPassword,
  secretCount,
  hasDocs,
  expiresAt,
  viewsLeft,
  sessionMinutes,
}: ShareGateProps) {
  const [state, action, pending] = useActionState(openShareLink.bind(null, token), undefined)

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted">
            {hasPassword ? <Lock className="size-5" /> : <ShieldCheck className="size-5" />}
          </div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {sharedBy ? `${sharedBy} shared a vault with you` : "A vault was shared with you"}
          </p>
          <CardTitle className="font-heading text-2xl">{vaultName}</CardTitle>
          {vaultDescription && <CardDescription>{vaultDescription}</CardDescription>}
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* What's inside: counts only, nothing sensitive before unlocking */}
          <div className="flex flex-wrap gap-2">
            <Chip icon={KeyRound}>
              {secretCount} {secretCount === 1 ? "secret" : "secrets"}
            </Chip>
            {hasDocs && <Chip icon={FileText}>Setup docs</Chip>}
            {hasPassword && <Chip icon={Lock}>Password protected</Chip>}
          </div>

          <dl className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <Detail icon={Clock} label="Link expires">
              <span suppressHydrationWarning>{expiresAt ? fmtDate(expiresAt) : "Never"}</span>
            </Detail>
            {viewsLeft !== null && (
              <Detail icon={Eye} label="Opens remaining">
                {viewsLeft}
              </Detail>
            )}
            <Detail icon={Timer} label="Session time">
              {sessionMinutes} min after unlocking
            </Detail>
          </dl>

          <Separator />

          <form action={action} className="flex flex-col gap-4">
            <FormAlert error={state?.error} />
            {hasPassword ? (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" name="password" autoComplete="off" required autoFocus />
                <p className="text-xs text-muted-foreground">
                  The sender should have given you this separately from the link.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Make sure you&apos;re somewhere private before revealing these credentials.
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Opening…" : hasPassword ? "Unlock vault" : "Reveal secrets"}
            </Button>
            {viewsLeft !== null && viewsLeft <= 3 && (
              <p className="text-center text-xs text-muted-foreground">
                Opening uses 1 of the {viewsLeft} remaining {viewsLeft === 1 ? "open" : "opens"}.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <ul className="grid gap-2 px-1 text-xs text-muted-foreground">
        <li className="flex gap-2">
          <ShieldCheck className="size-4 shrink-0" />
          Secrets are encrypted at rest and only decrypted for this page.
        </li>
        <li className="flex gap-2">
          <Eye className="size-4 shrink-0" />
          This is read-only. Copy values or download them as a .env file.
        </li>
        <li className="flex gap-2">
          <Lock className="size-4 shrink-0" />
          Don&apos;t forward this link. Ask the sender to create one for anyone else who needs access.
        </li>
      </ul>
    </div>
  )
}

function Chip({ icon: Icon, children }: { icon: typeof Lock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
      <Icon className="size-3.5 text-muted-foreground" />
      {children}
    </span>
  )
}

function Detail({ icon: Icon, label, children }: { icon: typeof Lock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
