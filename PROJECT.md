# Anchor — Project & Design Doc

This document consolidates the product thinking and technical decisions behind Anchor. It's meant as a single source of context — for the developer and for any AI assistant working on the project. See [`README.md`](./README.md) for setup and [`CLAUDE.md`](./CLAUDE.md) for working conventions.

---

## 1. Problem

During eating disorder recovery, using healthy coping mechanisms consistently is critical — but in moments of distress or emotional overwhelm, it's hard to quickly identify and use the right one. Existing tools (spreadsheets, notes apps, static lists) are slow to search, awkward on mobile, hard to organize by situation, and offer no easy way to see what actually helps.

**In one line:** it's hard to access the right coping skill quickly and intentionally in a moment of need.

## 2. Users

- **Primary (MVP):** the creator, during ED recovery.
- **Secondary (future):** others in eating disorder recovery.
- **Long-term:** general mental-health users building healthier coping habits.

## 3. Goals

- Quickly access coping skills filtered by need, situation, or effort.
- Log which skills were used and how helpful they were.
- Build a personalized toolkit that genuinely works for the individual over time.
- Develop healthier automatic responses through repetition and gentle reflection.

### Core use cases

| Situation | Goal |
| :---- | :---- |
| Crisis | Reach fast, practical alternatives to harmful behaviors |
| Emotional regulation | Reduce emotional intensity and stabilize |
| Distraction | Ride out urges and cravings |
| Baseline life-building | Plan positive habits/activities that improve daily life |

## 4. Product philosophy & tone

- **Tone:** gentle, supportive, clear. Never clinical-cold, never cheerful-pushy.
- **Design values:** minimalist, low-friction, emotionally safe.
- **Guiding principle:** reduce the friction of choosing a healthy coping mechanism to as close to zero as possible.

## 5. MVP scope

| Feature | Description |
| :---- | :---- |
| Auth | Email + password sign up / log in / log out (Supabase Auth) |
| Create skills | Add a skill with title, description, and tags |
| Tag taxonomy | Fixed set of categories and their tags (see §9) |
| Tag assignment | Tag skills so they can be filtered fast |
| Quick finder | Filter by tag/category to find a skill in under ~10 seconds |
| Skill detail | View / edit / delete a skill |
| Usage logging | Log a use, with an optional 1–5 helpfulness rating and note |
| History | List of recent logs for reflection |
| Favorites / crisis set | Pin go-to skills; an ordered set powers crisis mode |
| Mobile-friendly UI | Must feel good on a phone |
| Privacy | Data scoped to the owning user only |
| Data export | Export all personal data as CSV / JSON |

### Experience requirements

- Fast search and filtering.
- Minimalist UI.
- Low-friction: ≤3 taps to find a skill.

## 6. Anti-scope & deferrals

**Out of scope (and to be left out deliberately):**

- Social sharing.
- Gamification / streaks — adds pressure that's counterproductive for this audience.
- Mood or urge-intensity tracking — deliberately excluded; keeps the tool from becoming symptom surveillance.
- Food / calorie / weight / macro tracking — out of scope and harmful for this audience. No numeric targets around eating or the body, anywhere.
- Push notifications.
- Therapist integration.
- AI recommendations and ML trend forecasting.
- Group routines.
- Heavy graphics / visualizations.

**Deferred (likely future iterations):**

- PWA install (home-screen icon) and offline access to the toolkit — valuable for crisis use, but offline brings sync complexity, so the MVP is online-only.
- Custom user-defined tags — shelved to avoid taxonomy sprawl; a controlled mechanism (propose-into-existing-category, or a curated expansion set) is the preferred future approach.

## 7. Architecture

### Stack & rationale

- **Vite + React + TypeScript** — a lean single-page app. The product is private and auth-gated, so there's no need for server-side rendering; an SPA is the simplest thing that meets the requirements.
- **Tailwind CSS + shadcn/ui** — fast, consistent, mobile-first styling, with shadcn giving accessible pre-built components that are copied into the repo and owned directly.
- **TanStack Query** — handles caching, refetching, and optimistic updates (so logging a use feels instant).
- **Supabase** — Postgres, Auth, and Row-Level Security in one. There is **no custom backend server**.

### The Supabase + RLS model

The browser never holds database credentials and never connects to Postgres directly. It calls Supabase's HTTPS API using the **public anon key** (safe to ship) and the signed-in user's token. Authorization happens inside Postgres: **Row-Level Security policies** evaluate `auth.uid()` from the token on every query, so a client can only ever read or write its own rows — regardless of what it sends.

The security responsibility therefore lives in **getting the RLS policies right**, not in a hand-written API layer. This is only safe when RLS is enabled on every user table; a table with RLS off plus the public key is wide open. Given the sensitivity of recovery data, correct RLS is the central security task.

Example policy shape for `skills` (the same pattern applies to `usage_logs`):

```sql
alter table skills enable row level security;

create policy "own skills - select" on skills
  for select using (auth.uid() = user_id);
create policy "own skills - insert" on skills
  for insert with check (auth.uid() = user_id);
create policy "own skills - update" on skills
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own skills - delete" on skills
  for delete using (auth.uid() = user_id);
```

`tag_categories` and `tags` get RLS enabled with a single `using (true)` select policy and **no** write policies — readable by all, writable by none through the API.

### Seeding

On signup, a `security definer` trigger copies a set of default skills (with their tags and pre-set crisis priorities) into the new user's own rows, so a brand-new account has a working crisis mode immediately. The master list of default skills lives **inside that function** — there is no template table. The shared vocabulary (`tag_categories`, `tags`) is plain seed data in `seed.sql`.

### Hosting

Two services, both free to start: a static host (Vercel / Netlify / Cloudflare Pages) for the frontend, and Supabase cloud for data and auth.

## 8. Data model

The schema lives as SQL migrations in `supabase/migrations/`. The source-of-truth definition (DBML):

```dbml
Table users {
  id uuid [pk, note: 'Managed by Supabase Auth (auth.users)']
}

Table skills {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  title text [not null]
  description text
  is_favorite boolean [not null, default: false]
  crisis_priority int [note: 'Lower = shown first in crisis mode. NULL = not in the go-to set']
  is_default boolean [not null, default: false, note: 'True for skills copied from the seed set on signup']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    (user_id)
    (user_id, crisis_priority)
  }
}

Table tag_categories {
  slug text [pk, note: 'situation, setting, effort, senses, modality']
  name text [not null]
  is_multi_select boolean [not null, note: 'effort = false; the rest = true']
  is_optional boolean [not null, default: true]
  sort_order int [not null, default: 0]
}

Table tags {
  id uuid [pk, default: `gen_random_uuid()`]
  tag_category text [not null, ref: > tag_categories.slug, update: cascade]
  label text [not null]
  slug text [not null]
  sort_order int [not null, default: 0, note: 'Ordinal rank within category — drives effort low<med<high']

  indexes {
    (tag_category, slug) [unique]
  }
}

Table skill_tags {
  skill_id uuid [not null, ref: > skills.id, delete: cascade]
  tag_id uuid [not null, ref: > tags.id, delete: cascade]

  indexes {
    (skill_id, tag_id) [pk]
    (tag_id)
  }
}

Table usage_logs {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  skill_id uuid [not null, ref: > skills.id]
  used_at timestamptz [not null, default: `now()`]
  helpfulness int [note: '1–5, nullable. NULL = logged but not yet reflected on']
  note text

  indexes {
    (user_id, used_at)
    (skill_id)
  }
}
```

Notes that live outside the schema: RLS enforces the privacy model (§7); single-select on effort is enforced by the app, not the database; and `crisis_priority` is not constrained unique per user, so ties are broken on a secondary sort (e.g. most-recently-used).

## 9. Tag taxonomy

A **faceted** model: a fixed set of categories (`tag_categories`), each owning a fixed set of values (`tags`). A skill's tags are recorded in the `skill_tags` join table.

| Category | Multi-select? | Optional? | Notes |
| :---- | :---- | :---- | :---- |
| Situation | Yes | No | crisis, emotion-regulation, distraction, life-building |
| Effort | No (single) | — | low / medium / high — **ordinal**; `sort_order` is the rank |
| Setting | Yes | Yes | e.g. anywhere, home |
| Senses | Yes | Yes | sight, sound, touch, taste, smell (+ movement/physical) |
| Modality | Yes | Yes | e.g. DBT, CBT |

Effort is special: its `sort_order` is semantically load-bearing (it drives "low-effort or below" filtering), whereas for the other categories `sort_order` is just display order. Custom user-defined tags are **not** in the MVP (see §6).

Tip when seeding: space `sort_order` values out (10, 20, 30) so new tags can be inserted between existing ones without renumbering.

## 10. Crisis mode & favorites

Favorites, "go-to" skills, and crisis mode are one concept: the things you reach for first. Modeled minimally with `is_favorite` plus an optional `crisis_priority` integer that gives crisis mode an ordered list — no separate routines table. Crisis mode surfaces this ordered set instantly and must never require filtering to reach a skill. Named, richer routines are a possible future iteration.

## 11. Logging & reflection

Logging is intentionally low-friction. A use-log entry needs only the user, skill, and timestamp to exist. Helpfulness (1–5) and a note are **nullable** and can be added in the moment or later — an unreflected entry is simply one where `helpfulness` is null. Reflection can be surfaced occasionally and gently, and must always be skippable. It should never feel like a chore, a score, or a streak.

## 12. Privacy & safety

- Only the logged-in user can ever see their data, enforced by RLS at the database layer.
- Personal recovery data is never shared by default; users can export their data anytime.
- No sensitive identifiers are required.
- A crisis-support link is always reachable in the app, including from crisis mode. It surfaces ED-specific support (**National Alliance for Eating Disorders** helpline) and general crisis support (**988 Suicide & Crisis Lifeline**, US). These should be kept current and region-appropriate. The NEDA Helpline is **not** used (disconnected).

## 13. Success criteria (MVP)

- The user prefers the app on mobile over the old spreadsheet.
- A relevant coping skill can be found in under ~10 seconds.
- The app helps interrupt urges at least sometimes.
- Patterns in which skills help most begin to emerge over time.

## 14. Open questions & future

- A controlled mechanism for user-defined tags (without taxonomy sprawl).
- PWA install + offline access to the toolkit.
- Whether richer named "routines" are worth adding beyond the ordered crisis set.

## 15. Repo structure

```
src/                  # React app, organized by feature
  lib/                # Supabase client + TanStack Query setup
  types/database.ts   # generated from the schema
  features/           # auth, skills, finder, crisis, logging, history
  components/ui/      # shadcn/ui components
  hooks/              # shared query/mutation hooks
supabase/             # the database, as code
  migrations/         # 0001 tables · 0002 RLS · 0003 seed trigger
  seed.sql            # global vocabulary: tag_categories + tags
  functions/          # Edge Functions (none required for MVP)
public/               # static assets (+ PWA manifest later)
.env.local            # VITE_SUPABASE_URL + anon key (gitignored)
.env.example          # committed template
```
