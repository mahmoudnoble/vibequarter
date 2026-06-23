// Set the app-level webhook callback + subscribe to the "messages" field,
// using the app access token (app-id|app-secret). Reads creds from .env.local.
//   node scripts/wa-subscribe-app.mjs

import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const appId = env.WHATSAPP_APP_ID;
const appSecret = env.WHATSAPP_APP_SECRET;
const version = env.WHATSAPP_GRAPH_VERSION || "v23.0";
const verifyToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const callback =
  (env.NEXT_PUBLIC_SITE_URL && env.NEXT_PUBLIC_SITE_URL.startsWith("https")
    ? env.NEXT_PUBLIC_SITE_URL
    : "https://vibequarter.vercel.app") + "/api/whatsapp/webhook";

if (!appId || !appSecret) {
  console.error("✗ Missing WHATSAPP_APP_ID or WHATSAPP_APP_SECRET");
  process.exit(1);
}

const appToken = `${appId}|${appSecret}`;
const url = `https://graph.facebook.com/${version}/${appId}/subscriptions`;

const params = new URLSearchParams({
  object: "whatsapp_business_account",
  callback_url: callback,
  verify_token: verifyToken,
  fields: "messages",
  access_token: appToken,
});

console.log(`Subscribing app ${appId} → ${callback}`);
const res = await fetch(url, { method: "POST", body: params });
console.log(`POST /subscriptions → HTTP ${res.status}`);
console.log(await res.text(), "\n");

const listRes = await fetch(`${url}?access_token=${encodeURIComponent(appToken)}`);
console.log(`GET /subscriptions → HTTP ${listRes.status}`);
console.log(await listRes.text());
