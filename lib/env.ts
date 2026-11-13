import "server-only"

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL")
  },
  /** Signs session JWTs and HMACs OTP codes. Any long random string. */
  get AUTH_SECRET() {
    return required("AUTH_SECRET")
  },
  /** 32 bytes, base64 encoded. `openssl rand -base64 32` */
  get ENCRYPTION_KEY() {
    return required("ENCRYPTION_KEY")
  },
  get GOOGLE_CLIENT_ID() {
    return required("GOOGLE_CLIENT_ID")
  },
  get GOOGLE_CLIENT_SECRET() {
    return required("GOOGLE_CLIENT_SECRET")
  },
  get RESEND_API_KEY() {
    return required("RESEND_API_KEY")
  },
  get EMAIL_FROM() {
    return required("EMAIL_FROM")
  },
  get APP_URL() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
  },
  get isProd() {
    return process.env.NODE_ENV === "production"
  },
}
