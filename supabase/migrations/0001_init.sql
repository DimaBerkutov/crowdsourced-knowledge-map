-- Crowdsourced Knowledge Map — initial schema + RLS
-- This database is SHARED with another project, so all objects are prefixed
-- with `km_` to avoid collisions in the public schema.
-- Run in Supabase SQL Editor or via `npm run db:migrate`.

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.km_nodes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text,
  type       text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.km_edges (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.km_nodes (id) on delete cascade,
  target_id     uuid not null references public.km_nodes (id) on delete cascade,
  relation_type text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint km_edges_no_self_loop check (source_id <> target_id),
  constraint km_edges_unique unique (source_id, target_id, relation_type)
);

create index if not exists km_edges_source_idx on public.km_edges (source_id);
create index if not exists km_edges_target_idx on public.km_edges (target_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for km_nodes
-- ---------------------------------------------------------------------------

create or replace function public.km_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists km_nodes_set_updated_at on public.km_nodes;
create trigger km_nodes_set_updated_at
  before update on public.km_nodes
  for each row execute function public.km_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.km_nodes enable row level security;
alter table public.km_edges enable row level security;

-- Public read access
drop policy if exists "km_nodes_select_public" on public.km_nodes;
create policy "km_nodes_select_public" on public.km_nodes
  for select using (true);

drop policy if exists "km_edges_select_public" on public.km_edges;
create policy "km_edges_select_public" on public.km_edges
  for select using (true);

-- Authenticated users may create rows; created_by must be their own uid
drop policy if exists "km_nodes_insert_auth" on public.km_nodes;
create policy "km_nodes_insert_auth" on public.km_nodes
  for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "km_edges_insert_auth" on public.km_edges;
create policy "km_edges_insert_auth" on public.km_edges
  for insert to authenticated
  with check (auth.uid() = created_by);

-- Authenticated users may edit any row (collaborative editing for MVP).
-- To restrict to authors later: replace `using (true)` with `using (auth.uid() = created_by)`.
drop policy if exists "km_nodes_update_auth" on public.km_nodes;
create policy "km_nodes_update_auth" on public.km_nodes
  for update to authenticated
  using (true) with check (true);

drop policy if exists "km_edges_update_auth" on public.km_edges;
create policy "km_edges_update_auth" on public.km_edges
  for update to authenticated
  using (true) with check (true);
