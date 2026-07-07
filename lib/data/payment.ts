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

/**
 * Build a UPI deep link (`upi://pay?...`). On a phone this opens GPay / PhonePe
 * / Paytm etc. with the amount pre-filled; encoded as a QR it can be scanned
 * from any UPI app.
 */
export function buildUpiLink(config: PaymentConfig): string {
  const params = new URLSearchParams({
    pa: config.upiId,
    pn: config.payeeName,
    am: String(config.amount),
    cu: "INR",
    tn: config.note,
  });
  return `upi://pay?${params.toString()}`;
}
