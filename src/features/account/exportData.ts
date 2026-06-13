import { supabase } from '@/lib/supabase'
import { helpOptions } from '@/features/logging/logging'

// Builds and downloads the user's complete personal data, on demand. Everything
// is read through the normal client (RLS scopes it to the owner), so an export
// can only ever contain the signed-in user's own data.

type ExportTag = { category: string; slug: string }
type ExportSkill = {
  title: string
  description: string | null
  isFavorite: boolean
  crisisPriority: number | null
  createdAt: string
  tags: ExportTag[]
}
type ExportLog = {
  usedAt: string
  skillTitle: string
  helpfulness: number | null
  helpfulnessLabel: string | null
  note: string | null
}
export type ExportData = {
  exportedAt: string
  skills: ExportSkill[]
  reflections: ExportLog[]
}

const helpLabel = (v: number | null) =>
  helpOptions.find((o) => o.value === v)?.label ?? null

// Pulls the full toolkit (with tags) and every reflection. Shapes match the rest
// of the app's reads; ordered oldest-first so an export reads chronologically.
export async function fetchExportData(): Promise<ExportData> {
  const [skillsRes, logsRes] = await Promise.all([
    supabase
      .from('skills')
      .select(
        'title, description, is_favorite, crisis_priority, created_at, skill_tags(tags(slug, tag_category))',
      )
      .order('created_at', { ascending: true }),
    supabase
      .from('usage_logs')
      .select('used_at, helpfulness, note, skills(title)')
      .order('used_at', { ascending: true }),
  ])
  if (skillsRes.error) throw skillsRes.error
  if (logsRes.error) throw logsRes.error

  type SkillRow = {
    title: string
    description: string | null
    is_favorite: boolean
    crisis_priority: number | null
    created_at: string
    skill_tags:
      | { tags: { slug: string; tag_category: string } | { slug: string; tag_category: string }[] | null }[]
      | null
  }
  type LogRow = {
    used_at: string
    helpfulness: number | null
    note: string | null
    skills: { title: string } | { title: string }[] | null
  }

  const skills: ExportSkill[] = (skillsRes.data as unknown as SkillRow[]).map(
    (r) => ({
      title: r.title,
      description: r.description,
      isFavorite: r.is_favorite,
      crisisPriority: r.crisis_priority,
      createdAt: r.created_at,
      tags: (r.skill_tags ?? [])
        .map((st) => (Array.isArray(st.tags) ? st.tags[0] : st.tags))
        .filter((t): t is { slug: string; tag_category: string } => t != null)
        .map((t) => ({ category: t.tag_category, slug: t.slug })),
    }),
  )

  const reflections: ExportLog[] = (logsRes.data as unknown as LogRow[]).map(
    (r) => {
      const skill = Array.isArray(r.skills) ? r.skills[0] : r.skills
      return {
        usedAt: r.used_at,
        skillTitle: skill?.title ?? 'A skill',
        helpfulness: r.helpfulness,
        helpfulnessLabel: helpLabel(r.helpfulness),
        note: r.note,
      }
    },
  )

  return { exportedAt: new Date().toISOString(), skills, reflections }
}

// --- formatting --------------------------------------------------------------

function tagsFor(skill: ExportSkill, category: string): string {
  return skill.tags
    .filter((t) => t.category === category)
    .map((t) => t.slug)
    .join('; ')
}

// Minimal RFC-4180 escaping: quote fields containing commas, quotes or newlines.
function csvCell(value: string | number | boolean | null): string {
  if (value === null) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number | boolean | null)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function skillsToCsv(data: ExportData): string {
  return toCsv(
    ['title', 'description', 'situation', 'effort', 'setting', 'senses', 'modality', 'favorite', 'crisis_priority'],
    data.skills.map((s) => [
      s.title,
      s.description,
      tagsFor(s, 'situation'),
      tagsFor(s, 'effort'),
      tagsFor(s, 'setting'),
      tagsFor(s, 'senses'),
      tagsFor(s, 'modality'),
      s.isFavorite,
      s.crisisPriority,
    ]),
  )
}

export function reflectionsToCsv(data: ExportData): string {
  return toCsv(
    ['used_at', 'skill', 'helped', 'note'],
    data.reflections.map((l) => [l.usedAt, l.skillTitle, l.helpfulnessLabel, l.note]),
  )
}

// --- download ----------------------------------------------------------------

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

export async function exportJson() {
  const data = await fetchExportData()
  download(`anchor-data-${stamp()}.json`, 'application/json', JSON.stringify(data, null, 2))
}

export async function exportSkillsCsv() {
  const data = await fetchExportData()
  download(`anchor-skills-${stamp()}.csv`, 'text/csv', skillsToCsv(data))
}

export async function exportReflectionsCsv() {
  const data = await fetchExportData()
  download(`anchor-reflections-${stamp()}.csv`, 'text/csv', reflectionsToCsv(data))
}
