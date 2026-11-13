"use client"

import { Download, Eye, EyeOff, FileUp, Plus, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { saveSecrets } from "@/app/(app)/vaults/actions"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { downloadText, parseDotenv, toDotenv } from "@/lib/dotenv"

type Row = { uid: string; key: string; value: string; note: string }

let uidCounter = 0
const uid = () => `row-${++uidCounter}`

export function SecretsEditor({
  vaultId,
  vaultName,
  initial,
}: {
  vaultId: string
  vaultName: string
  initial: { key: string; value: string; note: string | null }[]
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((s) => ({ uid: uid(), key: s.key, value: s.value, note: s.note ?? "" }))
  )
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [pending, startTransition] = useTransition()

  const update = (next: Row[]) => {
    setRows(next)
    setDirty(true)
  }
  const patch = (id: string, field: keyof Omit<Row, "uid">, value: string) =>
    update(rows.map((r) => (r.uid === id ? { ...r, [field]: value } : r)))

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const duplicateKeys = new Set(
    rows.map((r) => r.key.trim()).filter((k, i, all) => k && all.indexOf(k) !== i)
  )

  const save = () =>
    startTransition(async () => {
      const filled = rows.filter((r) => r.key.trim() || r.value)
      const res = await saveSecrets(
        vaultId,
        filled.map(({ key, value, note }) => ({ key, value, note }))
      )
      if (res?.error) toast.error(res.error)
      else {
        setRows(filled)
        setDirty(false)
        toast.success(res?.success ?? "Saved")
      }
    })

  const importPaste = () => {
    const pairs = parseDotenv(pasteText)
    if (!pairs.length) {
      toast.error("No KEY=value lines found")
      return
    }
    const byKey = new Map(rows.map((r) => [r.key, r]))
    for (const { key, value } of pairs) {
      const existing = byKey.get(key)
      if (existing) byKey.set(key, { ...existing, value })
      else byKey.set(key, { uid: uid(), key, value, note: "" })
    }
    update([...byKey.values()].filter((r) => r.key || r.value))
    setPasteText("")
    setPasteOpen(false)
    toast.success(`Imported ${pairs.length} variable${pairs.length === 1 ? "" : "s"}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setPasteOpen(true)}>
          <FileUp /> Paste .env
        </Button>
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() =>
            downloadText(`${vaultName.replace(/\W+/g, "-").toLowerCase() || "vault"}.env`, toDotenv(rows))
          }
        >
          <Download /> Download .env
        </Button>
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          <Button onClick={save} disabled={pending || !dirty || duplicateKeys.size > 0}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)_auto] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground md:grid">
          <span>Key</span>
          <span>Value</span>
          <span>Note</span>
          <span className="w-24" />
        </div>
        {rows.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No secrets yet. Add one or paste a .env file.
          </p>
        )}
        {rows.map((row) => {
          const isRevealed = revealed.has(row.uid)
          const dup = duplicateKeys.has(row.key.trim())
          return (
            <div
              key={row.uid}
              className="grid grid-cols-1 gap-2 border-b px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,2fr)_auto] md:items-center"
            >
              <Input
                value={row.key}
                onChange={(e) => patch(row.uid, "key", e.target.value)}
                placeholder="API_KEY"
                className="font-mono text-xs"
                aria-invalid={dup || undefined}
                title={dup ? "Duplicate key" : undefined}
              />
              <Input
                value={row.value}
                onChange={(e) => patch(row.uid, "value", e.target.value)}
                placeholder="value"
                type={isRevealed ? "text" : "password"}
                autoComplete="off"
                className="font-mono text-xs"
              />
              <Input
                value={row.note}
                onChange={(e) => patch(row.uid, "note", e.target.value)}
                placeholder="Optional note"
                className="text-xs"
              />
              <div className="flex w-24 justify-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleReveal(row.uid)}
                  aria-label={isRevealed ? "Hide value" : "Show value"}
                >
                  {isRevealed ? <EyeOff /> : <Eye />}
                </Button>
                <CopyButton value={row.value} label="Copy value" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => update(rows.filter((r) => r.uid !== row.uid))}
                  aria-label="Remove"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        variant="outline"
        className="self-start"
        onClick={() => update([...rows, { uid: uid(), key: "", value: "", note: "" }])}
      >
        <Plus /> Add secret
      </Button>

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste .env contents</DialogTitle>
            <DialogDescription>
              KEY=value lines are imported. Existing keys are overwritten. Remember to save.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={"DATABASE_URL=postgres://…\nSTRIPE_SECRET_KEY=sk_live_…"}
          />
          <DialogFooter>
            <Button onClick={importPaste}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
