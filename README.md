# Crowdsourced Knowledge Map

A collaborative knowledge map: nodes (concepts/facts) and the edges between
them, visualized as an interactive force-directed graph.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
react-force-graph-2d.

## Features (MVP)

- Public read access to the graph (RLS: `public SELECT`).
- Node creation by authenticated users (form on the left).
- Graph with draggable nodes and clickable edges (shows the relation type).
- Sign-in via magic link (Supabase Auth, email OTP).

## Setup

1. **Create a Supabase project** and open Project Settings → API.
2. **Fill in `.env.local`** (see `.env.example`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. **Apply the migration** `supabase/migrations/0001_init.sql` — paste its
   contents into the Supabase SQL Editor and run it (creates the `nodes`/`edges`
   tables, indexes, the `updated_at` trigger, and RLS policies).
4. **Auth redirect:** in Supabase → Authentication → URL Configuration, add
   `http://localhost:3000/auth/callback` to the Redirect URLs.

## Running

```bash
npm install --legacy-peer-deps   # React 19 peer-deps
npm run dev                      # http://localhost:3000
```

`npm run build` — production build (includes TypeScript and ESLint checks).

## Seeding sample data

```bash
node --env-file=.env.local scripts/seed.mjs --reset
```

Populates the map with a starter Machine Learning / Data Science graph. Uses the
service-role key (bypasses RLS) and leaves `created_by` null. `--reset` wipes the
`km_*` tables first.

## Structure

```
supabase/migrations/0001_init.sql   # schema + RLS
src/
  proxy.ts                          # Supabase session refresh (formerly middleware)
  lib/supabase/{client,server,middleware,env}.ts
  types/graph.ts                    # DbNode/DbEdge → GraphData
  components/{GraphView,CreateNodeForm,CreateEdgeForm,AuthButton}.tsx
  app/
    page.tsx                        # graph loading (Server Component) + UI
    login/page.tsx                  # magic-link sign-in
    auth/callback/route.ts          # exchange code for a session
```

## Next (beyond MVP)

- Voting (`votes`) and moderation.
- UI for creating edges between nodes.
- Realtime updates via Supabase Realtime.
