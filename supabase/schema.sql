-- ============================================================================
-- VibeQuarter — multi-tenant schema (Supabase / Postgres)
-- Tenancy: each Clerk Organization is a tenant; every row carries org_id and is
-- protected by RLS reading the tenant from the Clerk session JWT.
-- Setup: connect Clerk as a third-party auth provider in Supabase, then run this.
-- ============================================================================

create or replace function public.org_id() returns text
language sql stable
set search_path = ''
as $$
  -- NULL (not '') when the claim is absent, so org-less users match zero rows.
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'org_id', '');
$$;

create table if not exists public.sites (
  id          uuid primary key default gen_random_uuid(),
  org_id      text not null check (org_id <> ''),
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
  unique (org_id, slug)
);
create index if not exists sites_org_idx on public.sites (org_id);

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  org_id     text not null check (org_id <> ''),
  site_id    uuid not null references public.sites (id) on delete cascade,
  name       text,
  email      text,
  phone      text,
  message    text,
  created_at timestamptz not null default now()
);
create index if not exists leads_org_idx on public.leads (org_id);

alter table public.sites enable row level security;
alter table public.leads enable row level security;

create policy "tenant reads its sites" on public.sites for select using (org_id = public.org_id());
create policy "tenant writes its sites" on public.sites for all using (org_id = public.org_id()) with check (org_id = public.org_id());
create policy "tenant reads its leads" on public.leads for select using (org_id = public.org_id());
create policy "tenant writes its leads" on public.leads for all using (org_id = public.org_id()) with check (org_id = public.org_id());

-- Public lead capture from a published site should go through a server route
-- using the service-role key (bypasses RLS), stamping org_id server-side.

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
