# ⚓️ Anchor

A personal, mobile-friendly toolkit for finding and tracking healthy coping skills — built to support eating disorder recovery by making the right skill fast to reach in a moment of need.

> **Status:** MVP in development.

## What it does

- Build a personal library of coping skills, each tagged by situation, effort, setting, senses, and (optionally) therapy modality.
- Find the right skill in seconds through fast, faceted filtering.
- A dedicated **crisis mode** that surfaces a small, pre-ordered set of go-to skills instantly — no filtering required.
- Log when you use a skill, with optional, low-pressure reflection on what helped.
- Review your history to notice patterns over time.
- Export your data anytime (CSV / JSON).

All data is private to each user.

## Tech stack

| Layer | Choice |
| :---- | :---- |
| Frontend | Vite + React + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Data fetching / caching | TanStack Query |
| Backend | Supabase (Postgres, Auth, Row-Level Security) — no custom API server |
| Hosting | Static frontend (Vercel / Netlify / Cloudflare Pages) + Supabase cloud |

See [`PROJECT.md`](./PROJECT.md) for the full product and design context, and [`CLAUDE.md`](./CLAUDE.md) for working conventions.

## Getting started

### Prerequisites

- Node.js (current LTS)
- A Supabase project (the free tier is plenty)
- The [Supabase CLI](https://supabase.com/docs/guides/cli)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# (Project Settings → API in the Supabase dashboard)

# 3. Link and apply the database schema
supabase link --project-ref <your-project-ref>
supabase db push          # applies migrations in supabase/migrations
# (locally, `supabase db reset` reruns migrations + seed.sql)

# 4. Generate TypeScript types from the schema
supabase gen types typescript --linked > src/types/database.ts

# 5. Run the app
npm run dev
```

### Environment variables

Only the public values live in the frontend:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The anon key is safe to ship — every table is guarded by Row-Level Security. **The service-role key must never appear in the frontend or any `VITE_`-prefixed variable.**

## Project structure

```
src/                  # React app, organized by feature
  lib/                # Supabase client + TanStack Query setup
  types/database.ts   # generated from the schema
  features/           # auth, skills, finder, crisis, logging, history
  components/ui/       # shadcn/ui components
  hooks/              # shared query/mutation hooks
supabase/             # the database, as code
  migrations/         # schema + RLS + seed trigger (versioned SQL)
  seed.sql            # global vocabulary: tag_categories + tags
  functions/          # Edge Functions (none required for MVP)
```

## Scripts

| Command | Description |
| :---- | :---- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `supabase gen types typescript --linked` | Regenerate DB types after a schema change |

## Privacy & safety

This app handles sensitive recovery data. Each user can only ever see their own skills and logs, enforced at the database layer by Row-Level Security. Nothing is shared by default, and users can export their data at any time. A link to crisis support is always reachable within the app.

## Not in the MVP

Social sharing, gamification/streaks, mood visualizations, push notifications, therapist integration, AI recommendations, and offline support are intentionally out of scope for the first version. See [`PROJECT.md`](./PROJECT.md) for the full anti-scope and roadmap.
