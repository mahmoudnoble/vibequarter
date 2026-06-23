// Fetch the real build logs of the latest Vercel deployment via the API,
// using the locally-stored CLI token. Prints only error-relevant lines.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function loadToken() {
  const candidates = [
    join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "com.vercel.cli", "auth.json"),
    join(homedir(), ".vercel", "auth.json"),
    join(homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf8")).token;
    } catch {}
  }
  throw new Error("no vercel auth.json found");
}

const token = loadToken();
const team = "team_JZbhLnBgulDfuv0HPnxkFQeM";
const headers = { Authorization: `Bearer ${token}` };

const depRes = await fetch(
  `https://api.vercel.com/v6/deployments?app=vibequarter&teamId=${team}&limit=5`,
  { headers },
);
const deps = await depRes.json();
const dep = deps.deployments?.[0];
console.log("latest deployment:", dep?.uid, "state:", dep?.state, dep?.url, "\n");
if (!dep) process.exit(0);

const evRes = await fetch(
  `https://api.vercel.com/v3/deployments/${dep.uid}/events?builds=1&limit=2000`,
  { headers },
);
const body = await evRes.text();

let events;
try {
  events = JSON.parse(body);
} catch {
  events = body.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { text: l }; } });
}
if (!Array.isArray(events)) events = [events];

const texts = events.map((e) => e?.payload?.text ?? e?.text ?? "").filter(Boolean);
const rx = /Type error|Failed to compile|error TS|\.tsx?:\d|not assignable|Cannot find|has no exported|does not exist|implicitly has/i;
console.log("=== error lines ===");
let printed = 0;
for (const t of texts) {
  for (const line of String(t).split("\n")) {
    if (rx.test(line)) { console.log(line.slice(0, 500)); printed++; }
  }
}
if (!printed) {
  console.log("(no matches — printing last 30 build lines)");
  console.log(texts.slice(-30).join("\n").slice(-3000));
}
