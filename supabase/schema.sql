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
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null check (owner_id <> ''),
  name        text not null,
  slug        text not null,
  domain      text,
  status      text not null default 'draft' check (status in ('draft','building','live')),
  locale      text not null default 'en' check (locale in ('en','ar')),
  brand_color text default '#10B981',
  prompt      text,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, slug)
);
create index if not exists sites_owner_idx on public.sites (owner_id);

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

create policy "owner reads its sites" on public.sites for select using (owner_id = public.current_tenant());
create policy "owner writes its sites" on public.sites for all using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());
create policy "owner reads its leads" on public.leads for select using (owner_id = public.current_tenant());
create policy "owner writes its leads" on public.leads for all using (owner_id = public.current_tenant()) with check (owner_id = public.current_tenant());

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
