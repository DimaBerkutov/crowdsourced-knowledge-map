-- 0002 — DEV MODE: allow anonymous writes (no auth required).
-- WARNING: this makes km_nodes / km_edges publicly writable by anyone holding
-- the anon key. Intended for local development only. To re-lock, restore the
-- `*_insert_auth` / `*_update_auth` policies from 0001_init.sql.
-- Run via: npm run db:migrate supabase/migrations/0002_dev_anon_write.sql

-- ---------------------------------------------------------------------------
-- Nodes: anyone may insert and update.
-- ---------------------------------------------------------------------------
drop policy if exists "km_nodes_insert_auth" on public.km_nodes;
drop policy if exists "km_nodes_update_auth" on public.km_nodes;

drop policy if exists "km_nodes_insert_public" on public.km_nodes;
create policy "km_nodes_insert_public" on public.km_nodes
  for insert to public with check (true);

drop policy if exists "km_nodes_update_public" on public.km_nodes;
create policy "km_nodes_update_public" on public.km_nodes
  for update to public using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Edges: anyone may insert and update.
-- ---------------------------------------------------------------------------
drop policy if exists "km_edges_insert_auth" on public.km_edges;
drop policy if exists "km_edges_update_auth" on public.km_edges;

drop policy if exists "km_edges_insert_public" on public.km_edges;
create policy "km_edges_insert_public" on public.km_edges
  for insert to public with check (true);

drop policy if exists "km_edges_update_public" on public.km_edges;
create policy "km_edges_update_public" on public.km_edges
  for update to public using (true) with check (true);
