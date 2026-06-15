# 🧠 Crowdsourced Knowledge Map

A collaborative knowledge map where ideas are **nodes** and the relationships
between them are **edges**, rendered as an interactive, force-directed graph.
Anyone can add concepts, facts, questions, and resources and connect them into a
living web of knowledge.

🔗 **Live demo:** https://dimaberkutov.github.io/crowdsourced-knowledge-map/

---

## ✨ Features

- **Interactive graph** — pan, zoom, and drag nodes; click an edge to inspect its
  relation type. Nodes are auto-colored by type.
- **Four node types** — `concept`, `fact`, `question`, and `resource`.
- **Five relation types** — `relates_to`, `depends_on`, `part_of`,
  `contradicts`, and `supports`.
- **Public read access** — the graph is visible to everyone.
- **Magic-link auth** — passwordless sign-in via Supabase Auth (email OTP).
- **Sample dataset** — a ready-to-explore Machine Learning / Data Science map
  (30 nodes, 36 edges) you can seed in one command.

## 🛠️ Tech stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript         |
| Styling  | Tailwind CSS v4                                          |
| Graph    | react-force-graph-2d                                    |
| Backend  | Supabase (Postgres + Auth + Row Level Security)         |
| Testing  | Vitest · React Testing Library                          |

## 🚀 Getting started

### 1. Install dependencies

```bash
npm install --legacy-peer-deps   # React 19 peer-deps
```

### 2. Configure environment

Create `.env.local` (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Apply the database schema

Run the migration in the Supabase SQL Editor (or via `npm run db:migrate`).
It creates the `km_nodes` / `km_edges` tables, indexes, an `updated_at`
trigger, and the Row Level Security policies:

```
supabase/migrations/0001_init.sql
```

> In **Supabase → Authentication → URL Configuration**, add
> `http://localhost:3000/auth/callback` to the Redirect URLs so magic-link
> sign-in works.

### 4. Run the dev server

```bash
npm run dev   # http://localhost:3000
```

## 🌱 Seed sample data

```bash
npm run db:seed   # add --reset to wipe first
```

Populates the map with a starter Machine Learning / Data Science graph. Uses the
service-role key (bypasses RLS) and leaves `created_by` null.

## ✅ Testing

```bash
npm test          # run once
npm run test:watch
```

The suite covers data mapping, the Supabase client wrappers, the session
middleware, the auth callback, and every UI component and page.

## 📁 Project structure

```
supabase/migrations/         # schema + RLS policies
scripts/
  apply-migration.mjs        # apply a SQL migration to Supabase
  seed.mjs                   # seed the sample graph
src/
  proxy.ts                   # Supabase session refresh (Next.js 16 "proxy")
  lib/supabase/              # client / server / middleware / env helpers
  types/graph.ts             # DbNode/DbEdge → GraphData mapping
  components/                # GraphView, CreateNodeForm, CreateEdgeForm, AuthButton
  app/
    page.tsx                 # graph loading (Server Component) + UI
    login/page.tsx           # magic-link sign-in
    auth/callback/route.ts   # exchange the code for a session
```

## 🗺️ Roadmap

- Voting and moderation for crowdsourced quality control.
- Search and filtering across nodes.
- Realtime updates via Supabase Realtime.

## 📄 License

MIT
