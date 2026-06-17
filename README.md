# vibequarter

The AI website builder — **bilingual (English + Arabic)** landing page, built on the
VibeQuarter brand. Next.js 15 (App Router, TS) · Tailwind · framer-motion ·
Clerk · Supabase · ready for Vercel. SEO + GEO baked in.

> This phase ships the **landing page**. Auth pages and the multi-tenant
> dashboard shell come next.

## Quick start

```bash
npm install
npm run dev   # http://localhost:3000
```

Runs immediately with **no keys** (auth + data are mocked / deferred). Add env
vars (`cp .env.local.example .env.local`) to switch on the real services.

## What's here

- **Landing** (`src/app/page.tsx`): nav → prompt-box hero → trust strip →
  "what we stand for" → features → pricing → testimonials → news → contact →
  CTA → newsletter → footer.
- **Bilingual EN/AR**: one dictionary (`src/lib/i18n.ts`), a `LanguageProvider`
  + toggle that flips `dir`/`lang` (RTL for Arabic) and the Arabic font.
- **Light + dark**: `next-themes` class strategy, light default (toggle in nav).
- **Animation**: framer-motion (`Reveal` whileInView), `prefers-reduced-motion`
  respected.
- **Brand**: VibeQuarter tokens mapped into `tailwind.config.ts` + `globals.css`
  (jade primary, indigo/cyan accents, cool-slate ink). Fonts: Space Grotesk /
  Plus Jakarta Sans / Space Mono / IBM Plex Sans Arabic.
- **SEO/GEO**: metadata, `sitemap.ts`, `robots.ts`, JSON-LD (Org + Software),
  branded `opengraph-image.tsx`, and `public/llms.txt`.
- **Stack foundation**: Clerk wired conditionally (`src/lib/auth.ts`), Supabase
  clients + `supabase/schema.sql` (multi-tenant, RLS by `org_id`).

## Turning on services (for the next phase)

1. **Clerk** — keys in `.env.local`, enable **Organizations** (multi-tenancy);
   billing via Clerk's `<PricingTable />`.
2. **Supabase** — run `supabase/schema.sql`, connect Clerk as a third-party auth
   provider so RLS reads `org_id` from the JWT.
3. **Vercel** — import the repo, add the same env vars, set `NEXT_PUBLIC_SITE_URL`.

## Customizing

- **All copy (EN + AR)** → `src/lib/i18n.ts` (placeholder metrics/testimonials/
  prices are flagged — replace before launch).
- **Brand colors / theme** → `tailwind.config.ts` + `src/app/globals.css`.

---

Note: this is an original implementation in the VibeQuarter brand, inspired by a
common SaaS landing structure — not a copy of any third-party template's code or
assets. Client logos and imagery are placeholders.

© VibeQuarter.
