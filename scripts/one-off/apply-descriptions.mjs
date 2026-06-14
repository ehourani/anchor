// One-off: fill in skill descriptions from agent-docs/skill-descriptions.tsv.
//
// Runs as YOU (RLS scopes every write to your rows). Your password is read from
// the environment at runtime — it never appears in code or git. The Supabase URL
// + anon key are read from .env.local.
//
// Usage:
//   SUPABASE_EMAIL=you@example.com SUPABASE_PASSWORD='…' node scripts/apply-descriptions.mjs --dry-run
//   SUPABASE_EMAIL=you@example.com SUPABASE_PASSWORD='…' node scripts/apply-descriptions.mjs
//
// --dry-run prints what would change without writing. Re-running is safe
// (idempotent: it just sets each description again).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const dryRun = process.argv.includes('--dry-run')

// --- env ---------------------------------------------------------------------
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

// --- parse the TSV (title, description, [check]) -----------------------------
const tsv = readFileSync(path.join(root, 'agent-docs/skill-descriptions.tsv'), 'utf8')
const rows = tsv
  .split('\n')
  .slice(1) // header
  .filter((l) => l.trim().length > 0)
  .map((l) => {
    const [title, description] = l.split('\t')
    return { title: title.trim(), description: (description ?? '').trim() }
  })

// --- run ---------------------------------------------------------------------
const supabase = createClient(url, anon)
const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
if (authErr) throw authErr

const { data: skills, error: readErr } = await supabase
  .from('skills')
  .select('id, title, description')
if (readErr) throw readErr

const byTitle = new Map(skills.map((s) => [s.title.trim(), s]))

let updated = 0
const missing = []
for (const row of rows) {
  const skill = byTitle.get(row.title)
  if (!skill) {
    missing.push(row.title)
    continue
  }
  if ((skill.description ?? '').trim() === row.description) continue // already set
  if (dryRun) {
    console.log(`would set: ${row.title}`)
    updated++
    continue
  }
  const { error } = await supabase
    .from('skills')
    .update({ description: row.description })
    .eq('id', skill.id)
  if (error) throw new Error(`Failed to update "${row.title}": ${error.message}`)
  updated++
}

console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updated} description(s).`)
if (missing.length) {
  console.log(`\n⚠ ${missing.length} title(s) in the sheet had no matching skill (renamed or deleted?):`)
  missing.forEach((t) => console.log(`   - ${t}`))
}
const stillEmpty = skills.filter((s) => !(s.description ?? '').trim()).map((s) => s.title)
if (stillEmpty.length && !dryRun) {
  console.log(`\nℹ ${stillEmpty.length} skill(s) still have no description (not in the sheet):`)
  stillEmpty.forEach((t) => console.log(`   - ${t}`))
}
await supabase.auth.signOut()
