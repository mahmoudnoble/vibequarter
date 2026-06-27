/**
 * VAT math for ZATCA invoices. Pure + currency-safe: amounts are rounded to 2
 * decimals and reconciled so subtotal + vatAmount === total exactly (no penny
 * drift from independent rounding).
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type InvoiceAmounts = {
  subtotal: number; // net (pre-VAT)
  vatAmount: number;
  total: number; // gross (incl. VAT)
};

/**
 * Compute invoice amounts from a single figure.
 * @param amount            the entered figure
 * @param vatRatePct        VAT rate as a percentage (e.g. 15)
 * @param amountIncludesVat true if `amount` is the gross (VAT-inclusive) total —
 *                          the common case for a clinic price list. False if it
 *                          is the net (pre-VAT) amount.
 */
export function computeInvoiceAmounts(
  amount: number,
  vatRatePct: number,
  amountIncludesVat: boolean,
): InvoiceAmounts {
  const rate = vatRatePct / 100;
  if (amountIncludesVat) {
    const total = round2(amount);
    const subtotal = round2(total / (1 + rate));
    return { subtotal, vatAmount: round2(total - subtotal), total };
  }
  const subtotal = round2(amount);
  const vatAmount = round2(subtotal * rate);
  return { subtotal, vatAmount, total: round2(subtotal + vatAmount) };
}

/** Format an amount as a fixed 2-decimal string (for the QR payload). */
export function amountStr(n: number): string {
  return n.toFixed(2);
}

/** Display invoice number from a per-clinic sequence, e.g. 1 -> "INV-000001". */
export function formatInvoiceNumber(seq: number): string {
  return `INV-${String(seq).padStart(6, "0")}`;
}
