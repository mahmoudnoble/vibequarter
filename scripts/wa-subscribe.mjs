// Subscribe our app to the WABA's webhooks (Meta Graph API).
// Reads creds from .env.local — no secrets on the command line.
//   node scripts/wa-subscribe.mjs            # subscribe + list
//   node scripts/wa-subscribe.mjs list       # just list current subscriptions

import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const token = env.WHATSAPP_ACCESS_TOKEN;
const waba = env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const version = env.WHATSAPP_GRAPH_VERSION || "v23.0";
if (!token || !waba) {
  console.error("✗ Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_BUSINESS_ACCOUNT_ID");
  process.exit(1);
}

const base = `https://graph.facebook.com/${version}/${waba}/subscribed_apps`;
const auth = { Authorization: `Bearer ${token}` };

if (process.argv[2] !== "list") {
  const sub = await fetch(base, { method: "POST", headers: auth });
  console.log(`POST subscribed_apps → HTTP ${sub.status}`);
  console.log(await sub.text(), "\n");
}

const list = await fetch(base, { headers: auth });
console.log(`GET subscribed_apps → HTTP ${list.status}`);
console.log(await list.text());
