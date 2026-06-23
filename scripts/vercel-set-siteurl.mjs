// Reliably (re)set NEXT_PUBLIC_SITE_URL on Vercel production.
// The PowerShell `"url" | vercel env add` pipe stored an empty value; spawnSync
// with `input` sends the exact string (no trailing newline).
import { spawnSync } from "node:child_process";

const value = "https://vibequarter.vercel.app";
spawnSync("vercel", ["env", "rm", "NEXT_PUBLIC_SITE_URL", "production", "-y"], {
  shell: true,
  stdio: "ignore",
});
const r = spawnSync("vercel", ["env", "add", "NEXT_PUBLIC_SITE_URL", "production"], {
  input: value,
  encoding: "utf8",
  shell: true,
});
console.log("add status:", r.status, (r.stderr || "").trim());
