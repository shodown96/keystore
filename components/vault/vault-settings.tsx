"use client"

import { useActionState, useTransition } from "react"

import { deleteVault, updateVaultMeta } from "@/app/(app)/vaults/actions"
import { FieldError, FormAlert } from "@/components/auth/auth-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export function VaultSettings({
  vaultId,
  name,
  description,
}: {
  vaultId: string
  name: string
  description: string | null
}) {
  const [state, action, pending] = useActionState(updateVaultMeta.bind(null, vaultId), undefined)
  const [deleting, startDelete] = useTransition()

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <form action={action} className="flex flex-col gap-4">
        <FormAlert error={state?.error} success={state?.success} />
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={name} required maxLength={100} />
          <FieldError errors={state?.fieldErrors?.name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={description ?? ""} maxLength={500} rows={3} />
        </div>
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <Separator />

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-medium text-destructive">Delete vault</h3>
          <p className="text-sm text-muted-foreground">
            Permanently deletes all secrets, docs and share links. This can&apos;t be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" className="self-start" />}>
            Delete vault
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                All secrets and share links will stop working immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting}
                onClick={() => startDelete(() => deleteVault(vaultId))}
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
