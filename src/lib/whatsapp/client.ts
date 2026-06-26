import "server-only";

/**
 * WhatsApp Cloud API client (Meta, direct — not a BSP).
 *
 * Meta requires the *sending* phone-number-id in the request path:
 *   POST https://graph.facebook.com/<version>/<phone-number-id>/messages
 * In multi-tenant production each clinic has its own number, so callers pass
 * the clinic's phone-number-id; the webhook gets it from the inbound message
 * metadata. Falls back to WHATSAPP_PHONE_NUMBER_ID (the single sandbox number).
 */

const graphVersion = () => process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

function token(): string {
  const t = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!t) throw new Error("WHATSAPP_ACCESS_TOKEN not configured");
  return t;
}

function resolvePhoneNumberId(explicit?: string): string {
  const id = explicit ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID not configured");
  return id;
}

function endpoint(phoneNumberId: string): string {
  return `https://graph.facebook.com/${graphVersion()}/${phoneNumberId}/messages`;
}

/** Send a plain-text WhatsApp message to a patient via Meta Cloud API. */
export async function sendText(to: string, body: string, phoneNumberId?: string): Promise<void> {
  const res = await fetch(endpoint(resolvePhoneNumberId(phoneNumberId)), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta WhatsApp send error ${res.status}: ${err}`);
  }
  // Log Meta's response so delivery issues are diagnosable. A 200 here only means
  // Meta ACCEPTED it — actual delivery still depends on the 24h window / the
  // sandbox's allowed-recipient list. The delivered/failed status arrives later
  // via a status webhook, not in this response.
  const data = (await res.json().catch(() => null)) as { messages?: Array<{ id?: string }> } | null;
  console.log(`[whatsapp] accepted to=${to} id=${data?.messages?.[0]?.id ?? "?"}`);
}

/**
 * Send an APPROVED WhatsApp message template (Meta Cloud API). Unlike free-form
 * text, a template delivers even OUTSIDE the 24h window — the right way to send
 * a booking confirmation to any patient. `bodyParams` fill the {{1}}, {{2}}, …
 * placeholders in the template's body, in order.
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[],
  phoneNumberId?: string,
): Promise<void> {
  const res = await fetch(endpoint(resolvePhoneNumberId(phoneNumberId)), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: bodyParams.length
          ? [
              {
                type: "body",
                // Meta rejects template params containing newlines/tabs/4+ spaces
                // (error 131009) — collapse whitespace so a stray newline in a
                // clinic/service name can't silently kill every confirmation.
                parameters: bodyParams.map((t) => ({
                  type: "text",
                  text: String(t).replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim(),
                })),
              },
            ]
          : [],
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta WhatsApp template error ${res.status}: ${err}`);
  }
  const data = (await res.json().catch(() => null)) as { messages?: Array<{ id?: string }> } | null;
  console.log(`[whatsapp] template '${templateName}' accepted to=${to} id=${data?.messages?.[0]?.id ?? "?"}`);
}

/** Mark an inbound message as read (double blue tick). Best-effort. */
export async function markRead(messageId: string, phoneNumberId?: string): Promise<void> {
  const t = process.env.WHATSAPP_ACCESS_TOKEN;
  const id = phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!t || !id) return;
  await fetch(endpoint(id), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch(() => undefined);
}
