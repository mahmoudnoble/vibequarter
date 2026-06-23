// Push env vars from .env.local to the linked Vercel project (production).
// Values are read from the file and piped via stdin — never printed.
//   node scripts/vercel-env-push.mjs
//
// Skips: comments, blanks, empty values, and NEXT_PUBLIC_SITE_URL
// (the prod URL isn't known until after the first deploy — set it after).

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const SKIP = new Set(["NEXT_PUBLIC_SITE_URL"]);

const vars = [];
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq < 1) continue;
  const key = line.slice(0, eq).trim();
  const val = line.slice(eq + 1).trim();
  if (!/^[A-Z0-9_]+$/.test(key) || !val || SKIP.has(key)) continue;
  vars.push([key, val]);
}

console.log(`Pushing ${vars.length} env vars to production…\n`);
let ok = 0;
for (const [key, val] of vars) {
  const r = spawnSync("vercel", ["env", "add", key, "production", "--force"], {
    input: val,
    encoding: "utf8",
    shell: true,
  });
  if (r.status === 0) {
    ok++;
    console.log(`  ✓ ${key}`);
  } else {
    const tail = (r.stderr || r.stdout || "").trim().split("\n").pop();
    console.log(`  ✗ ${key} — ${tail}`);
  }
}
console.log(`\n${ok}/${vars.length} set.`);
