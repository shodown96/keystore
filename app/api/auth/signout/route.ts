import { env } from "@/lib/env"
import { deleteSession } from "@/lib/session"

// Clears a stale/invalid session cookie (e.g. after a password reset elsewhere).
export async function GET() {
  await deleteSession()
  return Response.redirect(`${env.APP_URL}/login`, 302)
}
