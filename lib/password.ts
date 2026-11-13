import "server-only"

import bcrypt from "bcryptjs"

const ROUNDS = 12
let dummyHash: string | null = null

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

/** Burns the same time as a real compare so missing accounts aren't detectable by timing. */
export async function fakeVerify() {
  dummyHash ??= await bcrypt.hash("dummy-password", ROUNDS)
  await bcrypt.compare("not-the-password", dummyHash)
  return false
}
