import { NewVaultForm } from "@/components/vault/new-vault-form"

export default function NewVaultPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">New vault</h1>
        <p className="text-sm text-muted-foreground">
          Name it after the client or project, e.g. &ldquo;Acme — Production&rdquo;.
        </p>
      </div>
      <NewVaultForm />
    </div>
  )
}
