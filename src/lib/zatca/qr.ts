import "server-only";

/**
 * ZATCA Phase 1 simplified-invoice QR.
 *
 * The QR encodes a base64 string of concatenated TLV (Tag-Length-Value) fields,
 * each: 1 byte tag, 1 byte length (UTF-8 byte count of the value), then the
 * UTF-8 value. The five mandatory tags for a simplified tax invoice are:
 *   1 = seller name
 *   2 = seller VAT registration number (15 digits)
 *   3 = invoice timestamp (ISO 8601, e.g. 2026-06-27T12:30:00Z)
 *   4 = invoice total WITH VAT
 *   5 = VAT total
 *
 * Server-only (uses Buffer); invoices are generated server-side.
 */
function tlv(tag: number, value: string): Buffer {
  const v = Buffer.from(value, "utf8");
  // 1-byte length is sufficient for these short fields (names/numbers/amounts).
  return Buffer.concat([Buffer.from([tag, v.length]), v]);
}

export function buildZatcaQrPayload(input: {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  totalWithVat: string;
  vatTotal: string;
}): string {
  return Buffer.concat([
    tlv(1, input.sellerName),
    tlv(2, input.vatNumber),
    tlv(3, input.timestampIso),
    tlv(4, input.totalWithVat),
    tlv(5, input.vatTotal),
  ]).toString("base64");
}
