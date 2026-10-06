import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Skill, Tag, TagCategory } from './sampleSkills'
import type { NewSkillDraft } from './skills'
import { categoryStyles } from './TagChip'
import { tagVocabulary, type CategoryMeta } from './tagVocabulary'

type Selection = Record<TagCategory, string[]>

function emptySelection(defaultSituation: string | null): Selection {
  return {
    situation: defaultSituation ? [defaultSituation] : [],
    effort: [],
    setting: [],
    senses: [],
    modality: [],
  }
}

// An existing skill's tags, grouped back into the picker's selection shape.
// Skill.tags carry the slug as their label, which is exactly what the option
// buttons key on, so the grouping lines up without any remapping.
function selectionFromSkill(skill: Skill): Selection {
  const sel = emptySelection(null)
  for (const t of skill.tags) sel[t.category] = [...sel[t.category], t.label]
  return sel
}

// Senses and approach are optional extras, tucked behind a collapsed section
// so the required fields stay front and center.
const isOptionalCategory = (c: CategoryMeta) => !c.required
const hasOptionalTags = (skill: Skill | null) =>
  !!skill?.tags.some((t) => t.category === 'senses' || t.category === 'modality')

// The anchor form body (name, description, tags) plus its footer button. Shared
// by the Add/Edit sheet and the "I used a new anchor" step of the log sheet.
// State is initialized from props on mount, so callers remount it (via `key`)
// for a fresh form. Render it inside a flex column: the fields scroll, the
// footer stays pinned. `onSubmit` throwing shows a gentle error in place.
export function SkillForm({
  onSubmit,
  submitLabel,
  savingLabel,
  onCancel,
  skill = null,
  initialTitle = '',
  defaultSituation = null,
}: {
  onSubmit: (draft: NewSkillDraft) => Promise<void>
  submitLabel: string
  savingLabel: string
  // When given, a quiet secondary button sits beside the submit button.
  onCancel?: () => void
  skill?: Skill | null
  initialTitle?: string
  defaultSituation?: string | null
}) {
  const [title, setTitle] = useState(skill?.title ?? initialTitle)
  const [description, setDescription] = useState(skill?.description ?? '')
  const [selected, setSelected] = useState<Selection>(() =>
    skill ? selectionFromSkill(skill) : emptySelection(defaultSituation),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Open the extras when editing an anchor that already uses them.
  const [moreOpen, setMoreOpen] = useState(() => hasOptionalTags(skill))

  const toggle = (category: TagCategory, label: string, multi: boolean) => {
    setSelected((prev) => {
      const current = prev[category]
      if (multi) {
        return {
          ...prev,
          [category]: current.includes(label)
            ? current.filter((l) => l !== label)
            : [...current, label],
        }
      }
      // single-select (effort): tapping the active option clears it
      return { ...prev, [category]: current.includes(label) ? [] : [label] }
    })
  }

  // situation + effort + setting are required (see migration 0003).
  const valid =
    title.trim().length > 0 &&
    selected.situation.length > 0 &&
    selected.effort.length === 1 &&
    selected.setting.length > 0

  const submit = async () => {
    if (!valid || saving) return
    const tags: Tag[] = tagVocabulary.flatMap((c) =>
      selected[c.category].map((label) => ({ category: c.category, label })),
    )
    setError(null)
    setSaving(true)
    try {
      await onSubmit({ title, description, tags })
    } catch (err) {
      // Gentle for the user; full detail in the console for debugging.
      console.error('Failed to save skill:', err)
      setError("We couldn't save that just now. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // One tag category: its label (with "pick one" for effort) and icon chips.
  const renderCategory = (cat: CategoryMeta) => (
    <div key={cat.category}>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
        {cat.label}{' '}
        {!cat.multi && (
          <span className="normal-case text-foreground/35">(pick one)</span>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {cat.options.map((opt) => {
          const sel = selected[cat.category].includes(opt.slug)
          return (
            <button
              key={opt.slug}
              onClick={() => toggle(cat.category, opt.slug, cat.multi)}
              aria-pressed={sel}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                sel
                  ? cn(categoryStyles[cat.category], 'border-transparent')
                  : 'border-border bg-white/55 text-foreground/55 hover:bg-white/80',
              )}
            >
              <opt.Icon className="size-4" aria-hidden="true" />
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 pt-2">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/40">
            Name
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name this anchor"
            aria-label="Name"
            className="mt-1.5 w-full rounded-xl border border-border bg-white/70 p-3 text-base text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-foreground/40">
            Description{' '}
            <span className="normal-case text-foreground/35">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is it, and how do you do it?"
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-border bg-white/70 p-3 text-base text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {tagVocabulary
          .filter((cat) => !isOptionalCategory(cat))
          .map(renderCategory)}

        <div className="rounded-2xl border border-border/70 bg-white/40">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-controls="skill-form-extras"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-foreground/70"
          >
            <span>
              Additional info{' '}
              <span className="font-normal text-foreground/40">(optional)</span>
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-foreground/45 transition-transform duration-200',
                moreOpen && 'rotate-180',
              )}
            />
          </button>
          {moreOpen && (
            <div id="skill-form-extras" className="space-y-5 px-4 pb-4">
              {tagVocabulary.filter(isOptionalCategory).map(renderCategory)}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 px-6 pb-6 pt-3">
        {error && (
          <p className="mb-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className="rounded-2xl px-5 py-3.5 font-semibold text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            onClick={submit}
            disabled={!valid || saving}
            className={cn(
              'flex-1 rounded-2xl py-3.5 font-semibold transition-colors',
              valid && !saving
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'cursor-not-allowed bg-primary/30 text-primary-foreground/70',
            )}
          >
            {saving ? savingLabel : submitLabel}
          </button>
        </div>
      </div>
    </>
  )
}
