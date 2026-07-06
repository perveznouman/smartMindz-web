/**
 * Payment configuration for event registration.
 *
 * Edit these values to change the fee, payee, or UPI account. The payment step
 * of the registration form builds a UPI deep link + QR code from this.
 */

export const PAYMENT = {
  /** Entry fee per event, in rupees. */
  amount: 1,
  /** UPI VPA that receives the payment. */
  upiId: "perveznouman@okicici",
  /** Payee name shown in the UPI app. */
  payeeName: "Nouman Pervez",
  /** Note attached to the transaction. */
  note: "SmartMindz Registration",
};

/**
 * Build a UPI deep link (`upi://pay?...`). On a phone this opens GPay / PhonePe
 * / Paytm etc. with the amount pre-filled; encoded as a QR it can be scanned
 * from any UPI app.
 */
export function buildUpiLink({
  amount = PAYMENT.amount,
  upiId = PAYMENT.upiId,
  payeeName = PAYMENT.payeeName,
  note = PAYMENT.note,
}: Partial<typeof PAYMENT> = {}): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
