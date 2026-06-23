// Throwaway WhatsApp send test (Meta Cloud API).
// Reads creds from .env.local — no secrets on the command line.
//
//   node scripts/wa-send-test.mjs <recipient> template   # hello_world (works anytime)
//   node scripts/wa-send-test.mjs <recipient> text        # free-form (needs an open 24h window)
//
// <recipient> = your WhatsApp number, country code first, digits only (e.g. 97338705548)

import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const token = env.WHATSAPP_ACCESS_TOKEN;
const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
const version = env.WHATSAPP_GRAPH_VERSION || "v23.0";
const to = process.argv[2];
const mode = (process.argv[3] || "template").toLowerCase();

if (!token || !phoneId) {
  console.error("✗ Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env.local");
  process.exit(1);
}
if (!to) {
  console.error("Usage: node scripts/wa-send-test.mjs <recipient-number> [template|text]");
  process.exit(1);
}

const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;
const body =
  mode === "text"
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: "رسالة تجريبية من حضور ✅ — الربط شغّال." },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name: "hello_world", language: { code: "en_US" } },
      };

console.log(`→ POST ${url}\n  mode=${mode} to=${to}`);
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});
console.log(`\n← HTTP ${res.status}`);
console.log(await res.text());
