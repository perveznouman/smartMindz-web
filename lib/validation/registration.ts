import { z } from "zod";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
} from "@/lib/data/countries";

/**
 * Registration validation — shared between the client form (react-hook-form
 * resolver) and the server API route, so rules can never drift apart. Also
 * reusable by a future mobile app.
 */

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(80, "Name is too long"),
    categoryId: z.string().trim().min(1, "Please select a category"),
    classYear: z.string().trim().min(1, "Please select your class / year"),
    institution: z
      .string()
      .trim()
      .max(120, "Too long")
      .optional()
      .or(z.literal("")),
    whatsappCountry: z
      .string()
      .trim()
      .refine((v) => COUNTRY_CODES.includes(v), "Please select a country")
      .default(DEFAULT_COUNTRY_CODE),
    whatsapp: z.string().trim().min(1, "Please enter your WhatsApp number"),
    event: z.string().trim().min(1, "Please select an event"),
    city: z.string().trim().min(2, "Please enter your city").max(80, "Too long"),
  })
  .superRefine((val, ctx) => {
    const country = getCountry(val.whatsappCountry);
    if (!country) return;
    // Strip everything non-digit, drop a possible leading country code, drop
    // a leading 0 — then require the exact expected digit count.
    const digits = val.whatsapp.replace(/\D/g, "");
    let local = digits;
    if (local.startsWith(country.dial)) local = local.slice(country.dial.length);
    if (local.startsWith("0")) local = local.slice(1);
    if (local.length !== country.digits) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: `Enter a valid ${country.digits}-digit ${country.name} number`,
      });
      return;
    }
    // India-only sanity check: mobile numbers begin 6–9.
    if (country.code === "IN" && !/^[6-9]/.test(local)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: "Indian mobile numbers start with 6, 7, 8 or 9",
      });
    }
  });

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

/**
 * Normalise a submitted WhatsApp number to `{dial}{local}` (no +), matching
 * the historical Indian format (`91XXXXXXXXXX`) but for any supported country.
 * Falls back to India if the country code is unknown.
 */
export function normalizeWhatsapp(raw: string, countryCode: string): string {
  const country = getCountry(countryCode) ?? getCountry(DEFAULT_COUNTRY_CODE)!;
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith(country.dial)) local = local.slice(country.dial.length);
  if (local.startsWith("0")) local = local.slice(1);
  local = local.slice(-country.digits);
  return `${country.dial}${local}`;
}
