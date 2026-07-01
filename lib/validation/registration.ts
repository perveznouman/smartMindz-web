import { z } from "zod";

/**
 * Registration validation — shared between the client form (react-hook-form
 * resolver) and the server API route, so rules can never drift apart. Also
 * reusable by a future mobile app.
 */

// Accepts Indian numbers as 10 digits, optionally prefixed with +91 / 91 / 0,
// tolerating spaces and dashes. Normalised separately before storage.
const whatsappRegex = /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/;

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  categoryId: z.string().trim().min(1, "Please select a category"),
  institution: z
    .string()
    .trim()
    .min(2, "Please enter your school / institution")
    .max(120, "Too long"),
  whatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, "Enter a valid 10-digit WhatsApp number"),
  eventId: z.string().trim().min(1, "Please select an event"),
  city: z.string().trim().min(2, "Please enter your city").max(80, "Too long"),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

/** Normalise an Indian mobile number to `91XXXXXXXXXX` (no +). */
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const tenDigit = digits.slice(-10);
  return `91${tenDigit}`;
}
