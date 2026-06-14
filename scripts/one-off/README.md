# One-off scripts

Throwaway data-backfill tooling — **not** part of the app or its build (that's
`scripts/generate-icons.mjs`). Kept for the record; safe to delete once the
backfills are done.

These read source data from gitignored sheets in `agent-docs/` (personal
recovery data never enters version control) and write through Supabase scoped to
the signed-in user by RLS. No service-role key is involved.

| Script | What it does |
|---|---|
| `build-browser-import.mjs` | Generates `agent-docs/browser-import.js` — a console snippet that applies the descriptions + logs using your existing in-browser session (works with Google login). This is the path we used. |
| `apply-descriptions.mjs` | Alternative: applies `agent-docs/skill-descriptions.tsv` from Node via email/password sign-in (`SUPABASE_EMAIL` / `SUPABASE_PASSWORD` env vars). |
| `apply-usage-logs.mjs` | Alternative: backfills `agent-docs/usage-history.tsv` from Node via email/password sign-in. |

All are idempotent: descriptions update only if changed; logs insert only if that
skill + timestamp isn't already present (so real, recent entries are untouched).
