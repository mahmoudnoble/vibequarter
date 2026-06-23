/** Subset of the WhatsApp Cloud API webhook payload we actually use. */
export type WhatsAppWebhook = {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<WhatsAppInboundMessage>;
        statuses?: Array<unknown>;
      };
    }>;
  }>;
};

export type WhatsAppInboundMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "image" | "audio" | "document" | "sticker" | "reaction" | "unsupported";
  text?: { body: string };
};
