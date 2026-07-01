import type { SiteContent } from "@/lib/types";

/**
 * WhatsApp notification layer.
 *
 * Current behaviour (no paid API): after a successful registration we return a
 * link for the user to JOIN the group / open a chat. The success screen surfaces
 * this as a prominent button.
 *
 * To upgrade to automated confirmation messages later (WhatsApp Cloud API or
 * Twilio), implement `sendConfirmation` to call that provider — the form and API
 * route already `await` it, so nothing else has to change.
 */

export interface ConfirmationContext {
  fullName: string;
  whatsapp: string; // normalised, e.g. 91XXXXXXXXXX
  eventTitle: string;
}

/** The link the registrant should tap to join the group / reach us. */
export function getJoinLink(content: SiteContent): string {
  return content.whatsappGroupLink || `https://wa.me/${content.whatsappContact.replace(/\D/g, "")}`;
}

/** A pre-filled wa.me message to our contact number (fallback / "message us"). */
export function getContactLink(content: SiteContent, message?: string): string {
  const number = content.whatsappContact.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

/**
 * Hook for automated confirmation. No-op today. Returns whether a message was
 * actually sent so callers can decide what to tell the user.
 */
export async function sendConfirmation(
  _ctx: ConfirmationContext,
): Promise<{ sent: boolean }> {
  // TODO: integrate WhatsApp Cloud API / Twilio here when credentials exist.
  return { sent: false };
}
