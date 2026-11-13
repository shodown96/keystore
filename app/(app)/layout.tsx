import Link from "next/link"

import { UserMenu } from "@/components/app/user-menu"
import { Logo } from "@/components/logo"
import { requireAccount } from "@/lib/dal"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <UserMenu name={account.name} email={account.email} avatarUrl={account.avatarUrl} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
