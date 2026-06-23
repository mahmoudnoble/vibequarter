-- ============================================================================
-- VibeQuarter — hybrid multi-tenant schema (Supabase / Postgres)
-- Tenancy: every row has owner_id = the ACTIVE Clerk Organization (team plan)
-- or the Clerk user id / sub (individual plan). RLS reads the owner from the
-- Clerk session JWT via current_tenant().
-- Setup: connect Clerk as a third-party auth provider in Supabase, then run this.
-- ============================================================================

-- current_tenant() = active org id if present, else the user id (sub). NULL
-- only if neither exists (never for a signed-in user), so it matches no rows.
create or replace function public.current_tenant() returns text
language sql stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json ->> 'org_id', ''),
    nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')
  );
$$;

create table if not exists public.sites (
  id            uuid primary key default gen_random_uuid(),
  owner_id      text not null check (owner_id <> ''),
  name          text not null,
  slug          text not null,
  domain        text,
  status        text not null default 'draft' check (status in ('draft','building','live')),
  locale        text not null default 'en' check (locale in ('en','ar')),
  brand_color   text default '#10B981',
  secondary_color text,   -- optional second brand color (two-tone palette)
  prompt        text,
  -- Phase 2 builder engine: the bilingual {en,ar} section/block document + brand/theme.
  content       jsonb,   -- versioned site document (see src/lib/site/schema.ts)
  logo_url      text,    -- uploaded brand logo (brand-assets bucket)
  palette       jsonb,   -- derived accessible palette (CSS-var shape)
  fonts         jsonb,   -- { display, body, mono, arabic }
  design_preset text,    -- chosen design-system preset id
  model_used    text,    -- audit: which Claude model generated this
  generated_at  timestamptz,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id, slug)
);
create index if not exists sites_owner_idx on public.sites (owner_id);

-- Builder chat history, persisted per site (replaces the in-memory placeholder).
create table if not exists public.site_messages (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references public.sites (id) on delete cascade,
  owner_id       text not null check (owner_id <> ''),
  role           text not null check (role in ('user','assistant')),
  text           text,
  lang           text check (lang in ('en','ar')),
  attachment_url text,
  tool_calls     jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists site_messages_site_idx on public.site_messages (site_id, created_at);

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  owner_id   text not null check (owner_id <> ''),
  site_id    uuid not null references public.sites (id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  message    text,
  created_at timestamptz not null default now()
);
create index if not exists leads_owner_idx on public.leads (owner_id);

alter table public.sites enable row level security;
alter table public.leads enable row level security;
alter table public.site_messages enable row level security;

create policy "owner reads its sites" on public.sites for select using (owner_id = public.current_tenant());
create policy "owner writes its sites" on public.sites for all using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());
create policy "owner reads its leads" on public.leads for select using (owner_id = public.current_tenant());
create policy "owner writes its leads" on public.leads for all using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());
create policy "owner reads its messages" on public.site_messages for select using (owner_id = public.current_tenant());
create policy "owner writes its messages" on public.site_messages for all using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

-- Public lead capture from a published site should go through a server route
-- using the service-role key (bypasses RLS), stamping owner_id server-side from
-- a trusted site_id -> owning-tenant lookup (never from the request body).

-- ============================================================================
-- Users — synced from Clerk on every sign-in via syncUser() server action.
-- Writes use the service-role key (server-side only); reads use RLS + JWT sub.
-- ============================================================================

create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  clerk_id   text not null unique,
  email      text,
  full_name  text,
  image_url  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_clerk_idx on public.users (clerk_id);

alter table public.users enable row level security;

create policy "user reads own record" on public.users
  for select using (
    clerk_id = coalesce(
      nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', ''), ''
    )
  );

-- ============================================================================
-- Plans — pricing tiers managed by a super-admin (see /admin/plans). Public can
-- read ACTIVE plans (pricing page); writes go through super-admin-gated server
-- actions using the service-role key (no client write policy). type drives the
-- account model: 'personal' = owner_id is the user; 'organization' = a team.
-- ============================================================================

create table if not exists public.plans (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  type          text not null check (type in ('personal','organization')),
  max_members   int not null default 1,
  price_monthly numeric,
  price_yearly  numeric,
  currency      text not null default 'USD',
  model         text not null default 'claude-haiku-4-5', -- Claude model the builder agent uses on this plan
  image_gen     boolean not null default false,           -- may this plan generate images with GPT Image?
  name          jsonb not null,                                  -- { "en": ..., "ar": ... }
  blurb         jsonb not null,
  features      jsonb not null default '{"en":[],"ar":[]}'::jsonb,
  cta           jsonb not null,
  price_label   jsonb,                                           -- shown when price is null (e.g. "Custom")
  cta_action    text not null default 'signup' check (cta_action in ('signup','contact')),
  featured      boolean not null default false,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "anyone reads active plans" on public.plans for select using (is_active = true);

-- ============================================================================
-- Subscriptions — links a tenant (owner_id = active org or user sub) to its
-- plan, so the builder agent resolves its Claude model tier from plans.model
-- server-side. Billing/payment cycle itself is out of scope; rows are written
-- by service-role (onboarding / future billing webhook). Tenants read their own.
-- ============================================================================

create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           text not null unique check (owner_id <> ''),
  plan_id            uuid not null references public.plans (id),
  status             text not null default 'active'
                       check (status in ('active','trialing','past_due','canceled')),
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists subscriptions_owner_idx on public.subscriptions (owner_id);

alter table public.subscriptions enable row level security;

create policy "owner reads its subscription" on public.subscriptions
  for select using (owner_id = public.current_tenant());

-- ============================================================================
-- Templates — a super-admin-curated catalog of ready-made site designs. Each
-- row carries a full bilingual SiteDocument that the builder agent CLONES and
-- adapts (content edits + small flexibility) instead of building from scratch,
-- saving model credit. The 4 built-in code presets (nexus/atelier/lumiere/
-- meridian) remain always-free defaults in code; THIS table holds ADDED
-- templates, each gated free/paid by the super-admin. 'paid' = usable only on a
-- paid pricing plan (enforced in the app layer + adapt server action).
-- Public can read ACTIVE templates (the picker shows paid ones as upgrade bait);
-- writes go through super-admin-gated server actions using the service-role key.
-- ============================================================================

create table if not exists public.templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  preset_id     text,                                            -- base DesignPreset id (renderer style/fonts); falls back to document.theme.presetId
  niche         jsonb not null default '{"en":"","ar":""}'::jsonb,
  name          jsonb not null,                                  -- { "en": ..., "ar": ... }
  description   jsonb not null default '{"en":"","ar":""}'::jsonb,
  document      jsonb not null,                                  -- the canonical SiteDocument cloned in adapt mode (see src/lib/site/schema.ts)
  thumbnail_url text,                                            -- optional preview image
  access        text not null default 'free' check (access in ('free','paid')),
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.templates enable row level security;

create policy "anyone reads active templates" on public.templates for select using (is_active = true);

-- ============================================================================
-- Booking core (حضور / Hodoor) — per-tenant clinic config + appointments that
-- power the AI WhatsApp booking agent (and the in-dashboard chat simulator).
-- Tenancy: every row carries owner_id = active org id else user sub, enforced by
-- RLS via current_tenant(). Atomic anti-double-booking: a GiST exclusion
-- constraint forbids two ACTIVE appointments in one clinic from overlapping in
-- time (race-safe at the database level). btree_gist lives in the extensions
-- schema (not public) per the security linter.
-- ============================================================================

create extension if not exists btree_gist with schema extensions;

-- One clinic profile per tenant. owner_id is unique so we select-or-create it
-- idempotently on dashboard load.
create table if not exists public.clinics (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            text not null unique check (owner_id <> ''),
  name                text not null default '',
  whatsapp            text,
  timezone            text not null default 'Asia/Riyadh',
  booking_window_days int  not null default 14 check (booking_window_days between 1 and 90),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists clinics_owner_idx on public.clinics (owner_id);

-- Services the clinic offers (bilingual names; duration drives slot length).
create table if not exists public.clinic_services (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete cascade,
  owner_id     text not null check (owner_id <> ''),
  name_en      text not null,
  name_ar      text not null,
  duration_min int  not null default 30 check (duration_min between 5 and 480),
  price        numeric,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists clinic_services_clinic_idx on public.clinic_services (clinic_id, sort_order);

-- Weekly opening hours. weekday: 0=Sunday .. 6=Saturday (Postgres dow).
create table if not exists public.working_hours (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinics (id) on delete cascade,
  owner_id   text not null check (owner_id <> ''),
  weekday    int  not null check (weekday between 0 and 6),
  open_time  time not null,
  close_time time not null,
  check (close_time > open_time)
);
create index if not exists working_hours_clinic_idx on public.working_hours (clinic_id, weekday);

-- Booked appointments. The exclusion constraint is the atomic lock that makes
-- double-booking impossible at the database level (race-safe).
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  owner_id      text not null check (owner_id <> ''),
  service_id    uuid references public.clinic_services (id) on delete set null,
  patient_name  text not null,
  patient_phone text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  status        text not null default 'booked'
                  check (status in ('booked','cancelled','completed','no_show')),
  reason        text,
  source        text not null default 'simulator'
                  check (source in ('simulator','whatsapp','manual')),
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint appointments_no_overlap
    exclude using gist (
      clinic_id with =,
      tstzrange(starts_at, ends_at) with &&
    ) where (status = 'booked')
);
create index if not exists appointments_clinic_idx on public.appointments (clinic_id, starts_at);

alter table public.clinics         enable row level security;
alter table public.clinic_services enable row level security;
alter table public.working_hours   enable row level security;
alter table public.appointments    enable row level security;

create policy "owner reads its clinic"  on public.clinics for select using (owner_id = public.current_tenant());
create policy "owner writes its clinic" on public.clinics for all    using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

create policy "owner reads its services"  on public.clinic_services for select using (owner_id = public.current_tenant());
create policy "owner writes its services" on public.clinic_services for all    using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

create policy "owner reads its hours"  on public.working_hours for select using (owner_id = public.current_tenant());
create policy "owner writes its hours" on public.working_hours for all    using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

create policy "owner reads its appointments"  on public.appointments for select using (owner_id = public.current_tenant());
create policy "owner writes its appointments" on public.appointments for all    using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

-- The booking agent writes through the service-role key (stamping owner_id +
-- clinic_id from the trusted session), so it bypasses RLS; these policies guard
-- any direct tenant reads/writes.

-- ----------------------------------------------------------------------------
-- WhatsApp Cloud API integration
-- ----------------------------------------------------------------------------

-- Links a Meta-registered WhatsApp number to this clinic.
-- After registering with Meta, store the phone_number_id here.
alter table public.clinics
  add column if not exists whatsapp_phone_number_id text;

create index if not exists clinics_wa_phone_idx
  on public.clinics (whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;

-- Per-patient conversation sessions (persists chat turns across WhatsApp messages).
-- TTL of 24h inactivity is enforced in application code.
create table if not exists public.whatsapp_sessions (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics(id) on delete cascade,
  owner_id        text not null,
  patient_phone   text not null,
  turns           jsonb not null default '[]'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (clinic_id, patient_phone)
);

alter table public.whatsapp_sessions enable row level security;

create policy "tenant_isolation" on public.whatsapp_sessions
  using  (owner_id = public.current_tenant())
  with check (owner_id = public.current_tenant());
