# CLAUDE.md

Guidance for Claude Code working in this repository. For full product and design context, read [`PROJECT.md`](./PROJECT.md).

## What this is

A personal coping-skills toolkit that helps someone in eating disorder recovery reach the right healthy coping skill quickly in a moment of need. **Treat this as a sensitive, care-first product** — the design choices below are deliberate, and the tone of the UI matters as much as the code.

## Stack

- **Frontend:** Vite + React + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (components in `src/components/ui/`)
- **Server data:** TanStack Query
- **Backend:** Supabase — Postgres + Auth + Row-Level Security. There is **no custom API server**; the client talks to Supabase via its JS SDK.

## Key commands

```bash
npm run dev                                        # dev server
npm run build                                      # production build
supabase migration new <name>                      # create a migration
supabase db push                                   # apply migrations to the linked project
supabase db reset                                  # local: rerun all migrations + seed.sql
supabase gen types typescript --linked > src/types/database.ts   # after any schema change
```

## Architecture rules (do not violate)

- **RLS is the security boundary, not app code.** Every user-owned table (`skills`, `usage_logs`) MUST have Row-Level Security enabled, with policies scoped to `auth.uid() = user_id`, before it ships. A table with RLS off plus the public anon key is a data exposure.
- **Keep secrets out of the frontend.** Only `VITE_SUPABASE_URL` and the public anon key belong in frontend env. The service-role key must never appear in the frontend or any `VITE_`-prefixed variable. If privileged logic is ever needed, it goes in a Supabase Edge Function with the key kept in function secrets.
- **Schema changes go through migrations**, never the dashboard UI. After changing the schema, regenerate `src/types/database.ts`.
- **`tag_categories` and `tags` are global, seeded, read-only vocabulary** (public-read RLS, no write policies). Only `skills` and `usage_logs` carry user data.
- **Default skills are seeded per-user on signup** via a `security definer` trigger; the master list of starter skills lives inside that function. There is no template table.
- **Effort is single-select and ordinal** (its `sort_order` is a true rank: low < medium < high) — enforce single-selection in the UI. Situation, setting, senses, and modality are multi-select; senses and modality are optional.

## Conventions

- Organize `src/` by **feature** (auth, skills, finder, crisis, logging, history), not by file type.
- TypeScript throughout; lean on the generated DB types for query safety.
- Use TanStack Query for all server data. Prefer **optimistic updates** for logging actions so they feel instant.

## Product principles (these shape UI, copy, and what we build)

- **Tone:** gentle, supportive, clear. Never clinical-cold, never cheerful-pushy.
- **Low friction above all:** finding a skill should take ≤3 taps / under ~10 seconds; logging a use should feel near-instant, with reflection optional.
- **Crisis mode** must be reachable fast and must never require filtering to get to a skill.
- **Reflection prompts are gentle and always skippable** — never nagging, never framed as a streak or a score.
- **Do not add, even if it seems helpful:** streaks, gamification, or anything that pressures usage; food / calorie / weight / macro tracking (out of scope and counterproductive for this audience); mood or urge-intensity tracking (deliberately excluded from the MVP). Do not introduce numeric targets of any kind around eating or the body.
- **A crisis-support link must always be reachable**, including from crisis mode. Surface ED-specific support (the **National Alliance for Eating Disorders** helpline) and general crisis support (the **988 Suicide & Crisis Lifeline**, US). Keep these current and region-appropriate. Do **not** use the NEDA Helpline — it has been disconnected.

## Privacy

Sensitive recovery data. Default to the most privacy-preserving option everywhere. Never broaden data scope beyond the owning user, and never log or surface personal data outside the user's own view.
