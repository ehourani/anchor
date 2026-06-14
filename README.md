# ⚓️ Anchor

A personal, mobile-friendly toolkit for finding and tracking healthy coping skills — built to support eating disorder recovery by making the right skill fast to reach in a moment of need.

> **Status:** MVP complete — deployed as an installable PWA and in early personal/closed testing.

## What it does

- Build a personal library of coping skills, each tagged by situation, effort, setting, senses, and (optionally) therapy modality (DBT / CBT / ACT / RO-DBT). Add, edit, delete, and favorite skills.
- Find the right skill in seconds through fast, faceted filtering.
- A dedicated **crisis mode** that surfaces a small, pre-ordered set of go-to skills instantly — no filtering required — with drag-to-reorder and crisis-support links always reachable.
- Log when you use a skill, with optional, low-pressure reflection (helpfulness + a note); edit or delete past reflections anytime.
- Review your history to notice what's helped over time — surfaced gently, never as a score or streak.
- A guided **first-run onboarding** to name yourself, add a few skills, and set up your crisis set.
- Manage your **account & data**: change your password, export everything (JSON / CSV), or permanently delete your account and all data.
- Installable to your home screen as a **PWA** (the app shell works offline).

All data is private to each user, enforced at the database layer by Row-Level Security.

## Tech stack

| Layer | Choice |
| :---- | :---- |
| Frontend | Vite + React + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Data fetching / caching | TanStack Query |
| Drag & drop | dnd-kit (crisis-set reordering) |
| PWA | vite-plugin-pwa (installable, offline app shell) |
| Backend | Supabase (Postgres, Auth, Row-Level Security) — no custom API server |
| Hosting | Static frontend on Vercel + Supabase cloud |

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
  features/           # auth, onboarding, skills, finder, crisis, logging, history, account
  components/         # shared UI (OceanBackdrop, MenuDrawer) + ui/ (shadcn)
public/               # PWA icons + favicon, and public legal pages (privacy.html, terms.html, legal.css)
scripts/              # generate-icons.mjs (PWA icons) + one-off/ (data-backfill tooling)
supabase/             # the database, as code
  migrations/         # tables + RLS + seeded vocabulary + signup trigger + RPCs (versioned SQL)
  seed.sql            # local-only convenience data (vocabulary lives in migration 0003)
  functions/          # Edge Functions (none required for MVP)
vercel.json           # clean URLs (so /privacy and /terms resolve)
```

## Scripts

| Command | Description |
| :---- | :---- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run gen:icons` | Regenerate the PWA icon set from the anchor mark |
| `supabase gen types typescript --linked` | Regenerate DB types after a schema change |

## Privacy & safety

This app handles sensitive recovery data. Each user can only ever see their own skills and logs, enforced at the database layer by Row-Level Security. Nothing is shared by default; users can export their data as JSON/CSV or delete their account and all data at any time. A crisis-support link — the **National Alliance for Eating Disorders** helpline and the **988 Suicide & Crisis Lifeline** (US) — is always reachable, including from crisis mode. A public privacy policy and terms of service are published as standalone pages (`/privacy` and `/terms`, also linked from the in-app Account & data screen).

Anchor is a self-help tool — not a medical device, a substitute for professional care, or an emergency service.

## Roadmap & anti-scope

Intentionally **out of scope** (by design, for this audience): social sharing, gamification / streaks, mood or urge-intensity tracking, food / calorie / weight tracking, numeric targets, and usage pressure of any kind.

Potential **future directions** being explored: email/push notifications, native apps, a personalization/recommendation layer, and a clinician-facing portal (a possible B2B2C direction). See [`PROJECT.md`](./PROJECT.md) for the full product context.
