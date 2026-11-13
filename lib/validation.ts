import { z } from "zod"

export const emailSchema = z.email("Enter a valid email").trim().toLowerCase()
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")

export type FormState = {
  error?: string
  success?: string
  fieldErrors?: Record<string, string[] | undefined>
} | undefined

export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>
}
