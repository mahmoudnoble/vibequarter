export const site = {
  name: "vibequarter",
  legalName: "VibeQuarter",
  // `||` (not `??`) so an empty-string env var also falls back — an empty
  // NEXT_PUBLIC_SITE_URL would otherwise make `new URL(site.domain)` throw at build.
  domain: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  tagline: "AI operations agent for clinics — booking, billing, and patient comms.",
  description:
    "VibeQuarter is an AI agent that runs a clinic's day-to-day operations: booking and managing appointments over WhatsApp and phone, ZATCA-compliant invoicing, collecting patient contact details, and routing patient questions to the doctor.",
  twitter: "@vibequarter",
} as const;
