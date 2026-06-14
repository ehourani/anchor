// Builds a self-contained browser-console snippet that applies the skill
// descriptions and historical usage logs using YOUR existing signed-in session
// (read from localStorage) — no password needed, works with Google login.
//
// It embeds the data from the two TSVs and writes agent-docs/browser-import.js.
// You then paste that file's contents into the DevTools console on the live app
// while logged in. Re-running in the console is safe (idempotent).
//
//   node scripts/build-browser-import.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

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
if (!url || !anon) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local')

function parseTsv(file) {
  return readFileSync(path.join(root, file), 'utf8')
    .split('\n')
    .slice(1)
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split('\t'))
}

const descriptions = parseTsv('agent-docs/skill-descriptions.tsv').map(([title, description]) => ({
  title: title.trim(),
  description: (description ?? '').trim(),
}))
const logs = parseTsv('agent-docs/usage-history.tsv').map(([title, used_at, helpfulness, note]) => ({
  title: title.trim(),
  used_at: used_at.trim(),
  helpfulness: helpfulness ? Number(helpfulness) : null,
  note: (note ?? '').trim() || null,
}))

const ref = new URL(url).host.split('.')[0]

const snippet = `// Anchor data import — paste into the DevTools console on the live app while
// signed in. Safe to re-run: descriptions are idempotent and logs skip any
// skill+timestamp already present (your real recent entries are untouched).
(async () => {
  const URL_ = ${JSON.stringify(url)}
  const ANON = ${JSON.stringify(anon)}
  const REF = ${JSON.stringify(ref)}
  const DESCRIPTIONS = ${JSON.stringify(descriptions)}
  const LOGS = ${JSON.stringify(logs)}

  const raw = localStorage.getItem('sb-' + REF + '-auth-token')
  if (!raw) return console.error('Not signed in — open the app and log in first, then re-run.')
  const sess = JSON.parse(raw)
  const token = sess.access_token ?? sess.currentSession?.access_token
  const userId = (sess.user ?? sess.currentSession?.user)?.id
  if (!token || !userId) return console.error('Could not read your session token. Make sure you are logged in.')

  const rest = URL_ + '/rest/v1'
  const headers = { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }

  const skills = await (await fetch(rest + '/skills?select=id,title,description', { headers })).json()
  const byTitle = new Map(skills.map((s) => [s.title.trim(), s]))

  // Descriptions (PATCH by id; skip if unchanged) ---------------------------
  let updated = 0; const descMissing = []
  for (const d of DESCRIPTIONS) {
    const s = byTitle.get(d.title)
    if (!s) { descMissing.push(d.title); continue }
    if ((s.description || '').trim() === d.description) continue
    const r = await fetch(rest + '/skills?id=eq.' + s.id, { method: 'PATCH', headers, body: JSON.stringify({ description: d.description }) })
    if (!r.ok) { console.error('description failed:', d.title, await r.text()); continue }
    updated++
  }
  console.log('Descriptions updated: ' + updated + (descMissing.length ? ' (no match: ' + descMissing.join(', ') + ')' : ''))

  // Logs (insert; skip skill+timestamp already present) ---------------------
  const existing = await (await fetch(rest + '/usage_logs?select=skill_id,used_at', { headers })).json()
  const seen = new Set(existing.map((l) => l.skill_id + '|' + Date.parse(l.used_at)))
  const toInsert = []; const logMissing = []
  for (const lg of LOGS) {
    const s = byTitle.get(lg.title)
    if (!s) { logMissing.push(lg.title); continue }
    if (seen.has(s.id + '|' + Date.parse(lg.used_at))) continue
    toInsert.push({ user_id: userId, skill_id: s.id, used_at: lg.used_at, helpfulness: lg.helpfulness, note: lg.note })
  }
  if (toInsert.length) {
    const r = await fetch(rest + '/usage_logs', { method: 'POST', headers, body: JSON.stringify(toInsert) })
    console.log(r.ok ? 'Logs inserted: ' + toInsert.length : 'Log insert failed: ' + (await r.text()))
  } else {
    console.log('Logs: nothing new to insert (all already present)')
  }
  if (logMissing.length) console.log('Log titles with no match: ' + logMissing.join(', '))
  console.log('Done — refresh the app to see the changes.')
})()
`

writeFileSync(path.join(root, 'agent-docs/browser-import.js'), snippet)
console.log('Wrote agent-docs/browser-import.js (' + descriptions.length + ' descriptions, ' + logs.length + ' logs)')
