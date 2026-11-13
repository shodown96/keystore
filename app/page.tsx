import { Clock, KeyRound, Link2, Lock } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentAccount } from "@/lib/dal"

const FEATURES = [
  { icon: KeyRound, title: "Vaults", body: "Group API keys, env vars and setup docs per client or project." },
  { icon: Lock, title: "Encrypted at rest", body: "Every value is AES-256-GCM encrypted before it hits the database." },
  { icon: Link2, title: "Share links", body: "Send clients a read-only link, optionally password protected." },
  { icon: Clock, title: "Expiring access", body: "Links expire on a schedule, after N views, or when you revoke them." },
]

export default async function HomePage() {
  if (await getCurrentAccount()) redirect("/dashboard")

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Logo />
        <div className="flex gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-4 py-16 text-center">
        <div className="flex max-w-2xl flex-col items-center gap-5">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Hand over credentials without pasting them in Slack.
          </h1>
          <p className="text-lg text-muted-foreground">
            Keystore holds your clients&apos; keys and environment variables in encrypted vaults, and
            shares them through links that expire.
          </p>
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Create your first vault
          </Link>
        </div>
        <div className="grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border p-5">
              <Icon className="mb-3 size-5" />
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
