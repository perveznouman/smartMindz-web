/**
 * Payment configuration — sourced from Supabase `site_content` (see
 * lib/types.ts SiteContent). Change the fee, payee, or UPI account from the
 * dashboard; no redeploy needed if a UPI VPA gets blocked.
 */
import type { SiteContent } from "@/lib/types";

export interface PaymentConfig {
  amount: number;
  upiId: string;
  payeeName: string;
  note: string;
}

export function getPaymentConfig(content: SiteContent): PaymentConfig {
  return {
    amount: content.paymentAmount,
    upiId: content.paymentUpiId,
    payeeName: content.paymentPayeeName,
    note: content.paymentNote,
  };
}

/** Shared UPI query string (pa/pn/am/cu/tn) used by every deep link + the QR. */
function upiQuery(config: PaymentConfig): string {
  return new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName,
    am: String(config.amount),
    cu: "INR",
    tn: config.note,
  }).toString();
}

/**
 * Build a generic UPI deep link (`upi://pay?...`). Best used as the QR payload:
 * any UPI app can scan it. As a tappable link it only behaves well on Android,
 * where it opens the system app-chooser — see `buildUpiAppLinks` for iOS.
 */
export function buildUpiLink(config: PaymentConfig): string {
  return `upi://pay?${upiQuery(config)}`;
}

export interface UpiAppLink {
  name: string;
  href: string;
}

/**
 * Per-app UPI deep links. iOS has no system UPI intent chooser like Android, so
 * a bare `upi://pay` link is claimed by whichever single app registered the
 * scheme (often WhatsApp Pay) and opens *that* app instead of letting the user
 * choose. Giving each major app its own scheme makes "Pay in <app>" work on
 * both iOS and Android. If the app isn't installed the link simply no-ops, so
 * the QR + manual UPI-ID instructions remain the fallback.
 */
export function buildUpiAppLinks(config: PaymentConfig): UpiAppLink[] {
  const q = upiQuery(config);
  return [
    { name: "Google Pay", href: `tez://upi/pay?${q}` },
    { name: "PhonePe", href: `phonepe://pay?${q}` },
    { name: "Paytm", href: `paytmmp://pay?${q}` },
  ];
}
