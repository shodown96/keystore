"use client"

import type { JSONContent } from "@tiptap/react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { saveNotes } from "@/app/(app)/vaults/actions"
import { RichTextEditor } from "@/components/rich-text"
import { Button } from "@/components/ui/button"

export function NotesEditor({ vaultId, initial }: { vaultId: string; initial: JSONContent | null }) {
  const doc = useRef<JSONContent | null>(initial)
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      const res = await saveNotes(vaultId, JSON.stringify(doc.current ?? { type: "doc", content: [] }))
      if (res?.error) toast.error(res.error)
      else {
        setDirty(false)
        toast.success(res?.success ?? "Saved")
      }
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Setup instructions and context. Shown to anyone with a share link.
        </p>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <RichTextEditor
        content={initial}
        onChange={(next) => {
          doc.current = next
          setDirty(true)
        }}
      />
    </div>
  )
}
