"use client"

import type { JSONContent } from "@tiptap/react"
import { Clock, Download, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { RichTextViewer } from "@/components/rich-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { downloadText, toDotenv } from "@/lib/dotenv"

type SharedSecret = { key: string; value: string; note: string | null }

export function SharedVaultView({
  name,
  description,
  secrets,
  notes,
  expiresAt,
  sessionMinutes,
}: {
  name: string
  description: string | null
  secrets: SharedSecret[]
  notes: JSONContent | null
  expiresAt: string | null
  sessionMinutes: number
}) {
  const [revealAll, setRevealAll] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const isShown = (key: string) => revealAll || revealed.has(key)
  const hasNotes = !!notes?.content?.some((n) => n.content?.length || n.type !== "paragraph")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{name}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          Your session ends {sessionMinutes} minutes after unlocking
          {expiresAt &&
            `, and the link expires ${new Date(expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`}
          .
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Secrets</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRevealAll((v) => !v)} disabled={!secrets.length}>
              {revealAll ? <EyeOff /> : <Eye />}
              {revealAll ? "Hide all" : "Reveal all"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!secrets.length}
              onClick={() => downloadText(".env", toDotenv(secrets))}
            >
              <Download /> .env
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {secrets.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No secrets in this vault.</p>
          ) : (
            <div className="divide-y border-t">
              {secrets.map((s) => (
                <div key={s.key} className="flex items-start gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold">{s.key}</div>
                    <div className="mt-1 font-mono text-xs break-all text-muted-foreground">
                      {isShown(s.key) ? s.value || <em>(empty)</em> : "•".repeat(Math.min(Math.max(s.value.length, 8), 32))}
                    </div>
                    {s.note && <div className="mt-1 text-xs text-muted-foreground italic">{s.note}</div>}
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isShown(s.key) ? "Hide" : "Show"}
                      onClick={() =>
                        setRevealed((prev) => {
                          const next = new Set(prev)
                          if (next.has(s.key)) next.delete(s.key)
                          else next.add(s.key)
                          return next
                        })
                      }
                    >
                      {isShown(s.key) ? <EyeOff /> : <Eye />}
                    </Button>
                    <CopyButton value={s.value} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasNotes && notes && (
        <Card>
          <CardHeader>
            <CardTitle>Docs</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextViewer content={notes} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
