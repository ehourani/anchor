// One-off: backfill historical usage logs from agent-docs/usage-history.tsv.
//
// Runs as YOU (RLS scopes every write to your rows); password comes from the
// environment at runtime. INSERT-ONLY and idempotent: it skips any log whose
// (skill, timestamp) already exists, so re-running never duplicates and your
// real, recent entries are left completely untouched.
//
// Usage:
//   SUPABASE_EMAIL=you@example.com SUPABASE_PASSWORD='…' node scripts/apply-usage-logs.mjs --dry-run
//   SUPABASE_EMAIL=you@example.com SUPABASE_PASSWORD='…' node scripts/apply-usage-logs.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const dryRun = process.argv.includes('--dry-run')

function readEnvLocal() {
  const out = {}
  for (const line of readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const env = readEnvLocal()
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY
const email = process.env.SUPABASE_EMAIL
const password = process.env.SUPABASE_PASSWORD
if (!url || !anon) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')
if (!email || !password) throw new Error('Set SUPABASE_EMAIL and SUPABASE_PASSWORD in the environment')

// --- parse the TSV (title, used_at, helpfulness, note) ------------------------
const tsv = readFileSync(path.join(root, 'agent-docs/usage-history.tsv'), 'utf8')
const rows = tsv
  .split('\n')
  .slice(1)
  .filter((l) => l.trim().length > 0)
  .map((l) => {
    const [title, used_at, helpfulness, note] = l.split('\t')
    return {
      title: title.trim(),
      used_at: used_at.trim(),
      helpfulness: helpfulness ? Number(helpfulness) : null,
      note: (note ?? '').trim() || null,
    }
  })

// --- run ---------------------------------------------------------------------
const supabase = createClient(url, anon)
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
if (authErr) throw authErr
const userId = auth.user.id

const { data: skills, error: readErr } = await supabase.from('skills').select('id, title')
if (readErr) throw readErr
const byTitle = new Map(skills.map((s) => [s.title.trim(), s.id]))

// Existing logs, keyed by skill + exact instant, so re-runs and real entries
// are never duplicated or disturbed.
const { data: existing, error: logErr } = await supabase
  .from('usage_logs')
  .select('skill_id, used_at')
if (logErr) throw logErr
const seen = new Set(existing.map((l) => `${l.skill_id}|${Date.parse(l.used_at)}`))

let inserted = 0
let skipped = 0
const missing = []
const toInsert = []
for (const row of rows) {
  const skillId = byTitle.get(row.title)
  if (!skillId) {
    missing.push(row.title)
    continue
  }
  if (seen.has(`${skillId}|${Date.parse(row.used_at)}`)) {
    skipped++
    continue
  }
  toInsert.push({
    user_id: userId,
    skill_id: skillId,
    used_at: row.used_at,
    helpfulness: row.helpfulness,
    note: row.note,
  })
}

if (dryRun) {
  console.log(`Would insert ${toInsert.length} log(s); skip ${skipped} already present.`)
  toInsert.forEach((r) => console.log(`   + ${r.used_at}  (h=${r.helpfulness})`))
} else if (toInsert.length) {
  const { error } = await supabase.from('usage_logs').insert(toInsert)
  if (error) throw error
  inserted = toInsert.length
  console.log(`Inserted ${inserted} log(s); skipped ${skipped} already present.`)
} else {
  console.log(`Nothing to insert; ${skipped} already present.`)
}

if (missing.length) {
  console.log(`\n⚠ ${missing.length} title(s) had no matching skill (renamed or deleted?):`)
  missing.forEach((t) => console.log(`   - ${t}`))
}
await supabase.auth.signOut()
