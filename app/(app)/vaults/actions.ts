"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { encrypt, randomToken, sha256 } from "@/lib/crypto"
import { getOwnedVault, requireAccount } from "@/lib/dal"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { EXPIRY_OPTIONS, type ExpiryOption } from "@/lib/share-link"
import { fieldErrors, type FormState } from "@/lib/validation"

async function ownedVaultOrThrow(vaultId: string) {
  const account = await requireAccount()
  const vault = await getOwnedVault(vaultId, account.id)
  if (!vault) throw new Error("Vault not found")
  return vault
}

// ---------- Vault CRUD ----------

const vaultMetaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500).optional(),
})

export async function createVault(_prev: FormState, formData: FormData): Promise<FormState> {
  const account = await requireAccount()
  const parsed = vaultMetaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const vault = await db.vault.create({
    data: {
      ownerId: account.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  })
  redirect(`/vaults/${vault.id}`)
}

export async function updateVaultMeta(vaultId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await ownedVaultOrThrow(vaultId)
  const parsed = vaultMetaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  await db.vault.update({
    where: { id: vaultId },
    data: { name: parsed.data.name, description: parsed.data.description || null },
  })
  revalidatePath(`/vaults/${vaultId}`)
  return { success: "Saved" }
}

export async function deleteVault(vaultId: string) {
  await ownedVaultOrThrow(vaultId)
  await db.vault.delete({ where: { id: vaultId } })
  redirect("/dashboard")
}

// ---------- Secrets ----------

const secretsSchema = z
  .array(
    z.object({
      key: z.string().trim().min(1, "Key is required").max(200),
      value: z.string().max(20_000),
      note: z.string().trim().max(500).optional(),
    })
  )
  .max(500)
  .refine((items) => new Set(items.map((i) => i.key)).size === items.length, {
    message: "Keys must be unique within a vault",
  })

export type SecretInput = z.input<typeof secretsSchema>[number]

/** Replaces the vault's full secret list (the editor always submits the whole set). */
export async function saveSecrets(vaultId: string, secrets: SecretInput[]): Promise<FormState> {
  await ownedVaultOrThrow(vaultId)
  const parsed = secretsSchema.safeParse(secrets)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.$transaction([
    db.secret.deleteMany({ where: { vaultId } }),
    db.secret.createMany({
      data: parsed.data.map((s, position) => ({
        vaultId,
        key: s.key,
        valueEnc: encrypt(s.value),
        note: s.note || null,
        position,
      })),
    }),
    db.vault.update({ where: { id: vaultId }, data: { updatedAt: new Date() } }),
  ])
  revalidatePath(`/vaults/${vaultId}`)
  return { success: "Secrets saved" }
}

// ---------- Docs (Tiptap JSON) ----------

export async function saveNotes(vaultId: string, docJson: string): Promise<FormState> {
  await ownedVaultOrThrow(vaultId)
  if (docJson.length > 500_000) return { error: "Document is too large" }
  try {
    JSON.parse(docJson)
  } catch {
    return { error: "Invalid document" }
  }
  await db.vault.update({ where: { id: vaultId }, data: { notesEnc: encrypt(docJson) } })
  revalidatePath(`/vaults/${vaultId}`)
  return { success: "Docs saved" }
}

// ---------- Share links ----------

const shareLinkSchema = z.object({
  label: z.string().trim().max(100).optional(),
  password: z.string().max(128).optional(),
  expiresIn: z.enum(Object.keys(EXPIRY_OPTIONS) as [ExpiryOption, ...ExpiryOption[]]),
  maxViews: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(10_000).optional()
  ),
})

export type CreateLinkState = (FormState & { path?: string }) | undefined

export async function createShareLink(
  vaultId: string,
  _prev: CreateLinkState,
  formData: FormData
): Promise<CreateLinkState> {
  await ownedVaultOrThrow(vaultId)
  const parsed = shareLinkSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const { label, password, expiresIn, maxViews } = parsed.data
  if (password && password.length < 6) {
    return { fieldErrors: { password: ["Use at least 6 characters"] } }
  }

  const token = randomToken(32)
  const ttl = EXPIRY_OPTIONS[expiresIn]

  await db.shareLink.create({
    data: {
      vaultId,
      label: label || null,
      tokenHash: sha256(token),
      passwordHash: password ? await hashPassword(password) : null,
      expiresAt: ttl ? new Date(Date.now() + ttl * 1000) : null,
      maxViews: maxViews ?? null,
    },
  })
  revalidatePath(`/vaults/${vaultId}`)
  // The raw token is only ever returned here, as a relative path; the client adds the domain.
  return { path: `/s/${token}`, success: "Link created" }
}

export async function revokeShareLink(linkId: string) {
  const account = await requireAccount()
  const link = await db.shareLink.findFirst({
    where: { id: linkId, vault: { ownerId: account.id } },
  })
  if (!link) throw new Error("Link not found")
  await db.shareLink.update({ where: { id: linkId }, data: { revokedAt: new Date() } })
  revalidatePath(`/vaults/${link.vaultId}`)
}

export async function deleteShareLink(linkId: string) {
  const account = await requireAccount()
  const link = await db.shareLink.findFirst({
    where: { id: linkId, vault: { ownerId: account.id } },
  })
  if (!link) throw new Error("Link not found")
  await db.shareLink.delete({ where: { id: linkId } })
  revalidatePath(`/vaults/${link.vaultId}`)
}
