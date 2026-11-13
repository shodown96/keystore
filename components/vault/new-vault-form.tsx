"use client"

import { useActionState } from "react"

import { createVault } from "@/app/(app)/vaults/actions"
import { FieldError, FormAlert } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function NewVaultForm() {
  const [state, action, pending] = useActionState(createVault, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert error={state?.error} />
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={100} autoFocus />
        <FieldError errors={state?.fieldErrors?.name} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" name="description" maxLength={500} rows={3} />
        <FieldError errors={state?.fieldErrors?.description} />
      </div>
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create vault"}
      </Button>
    </form>
  )
}
