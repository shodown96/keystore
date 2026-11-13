import { KeyRound } from "lucide-react"

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <KeyRound className="size-4" />
      </span>
      Keystore
    </span>
  )
}
