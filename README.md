# Keystore

Store API keys, env vars and setup docs in encrypted **vaults**, and share them with clients through **share links** that can be password protected, expire, and be view-limited.

Next.js 16 · Prisma 7 (Postgres) · Tailwind 4 / shadcn (Base UI) · JWT cookie auth (jose) · Google OAuth (arctic) · Resend · Tiptap

## Environment variables

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (a dummy value is fine for `prisma generate`) |
| `AUTH_SECRET` | Long random string. Signs session JWTs and HMACs OTP codes. `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | 32 bytes, base64. Encrypts secret values and docs. `openssl rand -base64 32`. **Losing or changing this makes stored secrets unreadable.** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client. Redirect URI: `${APP_URL}/api/auth/google/callback` |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | e.g. `Keystore <noreply@yourdomain.com>` (domain must be verified in Resend) |
| `APP_URL` | e.g. `http://localhost:3000`, used for OAuth redirects and share link URLs |

## Prisma

The client is generated into `lib/generated/prisma` (gitignored). `npm install` runs `prisma generate` automatically, or run it with `npm run db:generate`. No migrations are committed yet.

## Structure

- `prisma/schema.prisma`: Account, VerificationToken (OTP), Vault, Secret, ShareLink
- `lib/`: `crypto` (AES-GCM, hashing, OTP), `session` / `jwt` (cookies), `dal` (auth checks), `email`, `google`
- `app/(auth)`: login, register, forgot-password (OTP) and their server actions
- `app/(app)`: dashboard, vault editor and vault server actions
- `app/s/[token]`: public share page (gate, then read-only view)
- `proxy.ts`: optimistic route redirects. Real authorization lives in `lib/dal.ts`.
