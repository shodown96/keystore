import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifyJwt } from "@/lib/jwt"

// Optimistic checks only. Real authorization happens in lib/dal.ts.
const PROTECTED = ["/dashboard", "/vaults"]
const AUTH_PAGES = ["/login", "/register", "/forgot-password"]

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const session = await verifyJwt(req.cookies.get(SESSION_COOKIE)?.value, "session")

  if (!session && PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  if (session && AUTH_PAGES.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/vaults/:path*", "/login", "/register", "/forgot-password"],
}
