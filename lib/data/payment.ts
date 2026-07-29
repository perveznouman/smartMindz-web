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
  /**
   * Kept from `site_content` but deliberately NOT put in the UPI payload — see
   * buildUpiLink. Useful again if we move to a gateway, which can carry a note.
   */
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

/**
 * Build the UPI payload (`upi://pay?...`) used as the **QR code payload only**.
 * Deliberately NOT rendered as a tappable link anywhere.
 *
 * Carries ONLY the payee (`pa`) and payee name (`pn`). Do not add `am`.
 *
 * A pre-filled amount is what broke payments for most of our registrants. Google
 * Pay applies a limit check to intent-*specified* amounts arriving from an
 * unverified third-party link (no merchant `sign`/`mc`, which a personal VPA
 * cannot produce), and the effective cap is zero — so it declines with
 * "You've exceeded the bank limit for this payment. Retry with a smaller
 * amount." A ₹1 request fails exactly like a ₹100 one, which is what gives the
 * misleading error away.
 *
 * Verified by decoding the payee's own Google Pay QR — the one that has always
 * worked. It is NOT signed; it is simply `pa` + `pn` with no amount. Dropping
 * `am` makes this payload equivalent to it. The payer types the amount, which
 * the payment step displays prominently alongside the QR.
 *
 * Note: params are percent-encoded. `URLSearchParams.toString()` cannot be used
 * here — it form-encodes spaces as `+`, which UPI apps render literally
 * (users saw the note arrive as "SmartMindz+Registration").
 */
export function buildUpiLink(config: PaymentConfig): string {
  // `@` is legal unencoded in a query string, and the payee's working QR leaves
  // it raw. `%40` did resolve correctly in testing, but there is no upside to
  // differing from a payload we know works.
  const payee = encodeURIComponent(config.upiId).replace(/%40/g, "@");
  return `upi://pay?pa=${payee}&pn=${encodeURIComponent(config.payeeName)}`;
}
