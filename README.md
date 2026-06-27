# vibequarter

An **AI operations agent for clinics** — bilingual (Arabic + English) appointment
booking and management over **WhatsApp and phone/voice**, plus a clinic dashboard.
Next.js 15 (App Router, TS) · Tailwind · Clerk (auth + multi-tenancy) · Supabase
(RLS) · OpenAI (booking brain) · deployed on Vercel.

> Scope is clinic operations only. The booking agent is live; ZATCA-compliant
> invoicing and patient comms (contact capture, routing questions to the doctor)
> are on the roadmap.

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000  (also runs the dev Clerk→Supabase sync daemon)
npm run dev:app   # app only, without the sync daemon
```

Add env vars (`cp .env.local.example .env.local`) to switch on the real services.

## What's here

- **Booking brain** (`src/lib/booking/*`): an OpenAI agent with three grounded
  tools — `check_availability`, `book_appointment`, `cancel_appointment` —
  backed by Supabase with a GiST exclusion constraint that makes double-booking
  impossible. Same brain across every channel; `spoken` mode spells
  numbers/times as Arabic words so voice TTS pronounces them correctly.
- **WhatsApp channel** (`src/lib/whatsapp/*`, `src/app/api/whatsapp/webhook`):
  Meta Cloud API direct, HMAC-verified webhook, 24h session persistence, booking
  confirmation via an approved Meta template.
- **Voice channel** (`src/app/api/voice/*`): Vapi Custom-LLM endpoint with a
  zero-latency instant filler, plus a Hakim Gulf-Arabic TTS proxy.
- **Dashboard** (`src/app/dashboard/*`): Overview, Booking studio
  (Setup / Appointments / Patients / Simulator), and Settings.
- **Bilingual EN/AR**: one dictionary (`src/lib/i18n.ts`) + a `LanguageProvider`
  that flips `dir`/`lang` (RTL) and the Arabic font.
- **Auth + data**: Clerk wired conditionally (`src/lib/auth.ts`), Supabase
  clients + `supabase/schema.sql` (multi-tenant, RLS by tenant).

## Turning on services

1. **Clerk** — keys in `.env.local`, enable **Organizations** (multi-tenancy),
   connect Clerk as a Supabase third-party auth provider so RLS reads the tenant
   from the JWT.
2. **Supabase** — run `supabase/schema.sql`, add the Clerk domain as a
   third-party auth provider, use its URL + keys.
3. **WhatsApp** — Meta Cloud API: set the WhatsApp env vars and subscribe the
   webhook (`scripts/wa-subscribe*.mjs`).
4. **Voice** — Vapi assistant pointed at `/api/voice/chat/completions` (brain)
   and `/api/voice/tts` (Hakim voice).
5. **Vercel** — import the repo, add the same env vars, set `NEXT_PUBLIC_SITE_URL`.

## Customizing

- **All copy (EN + AR)** → `src/lib/i18n.ts`.
- **Brand colors / theme** → `tailwind.config.ts` + `src/app/globals.css`
  (jade primary).

---

© VibeQuarter.
