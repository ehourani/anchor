import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Tag, TagCategory } from './sampleSkills'
import type { NewSkillDraft } from './skills'
import { categoryStyles } from './TagChip'
import { tagVocabulary } from './tagVocabulary'

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

export function AddSkillSheet({
  open,
  onClose,
  onCreate,
  defaultSituation,
}: {
  open: boolean
  onClose: () => void
  onCreate: (draft: NewSkillDraft) => Promise<void>
  defaultSituation: string | null
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Selection>(emptySelection(null))
  const [added, setAdded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fresh form each open, pre-selecting the situation we came from.
  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setSelected(emptySelection(defaultSituation))
      setAdded(false)
      setSaving(false)
      setError(null)
    }
  }, [open, defaultSituation])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
      await onCreate({ title, description, tags })
      // Only celebrate once the write actually landed.
      setAdded(true)
    } catch (err) {
      // Gentle for the user; full detail in the console for debugging.
      console.error('Failed to add skill:', err)
      setError("We couldn't save that just now. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a coping skill"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {added ? 'Added to your toolkit' : 'Add a skill'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {added ? (
          <div className="px-6 pb-8 pt-4">
            <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
              <Check className="size-5" />
              <span className="font-semibold">
                “{title.trim()}” is in your toolkit now.
              </span>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 pt-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                  Name
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name this skill"
                  className="mt-1.5 w-full rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                  Description{' '}
                  <span className="normal-case text-foreground/35">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is it, and how do you do it?"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {tagVocabulary.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                    {cat.label}{' '}
                    <span className="normal-case text-foreground/35">
                      {cat.required
                        ? cat.multi
                          ? ''
                          : '(pick one)'
                        : '(optional)'}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cat.options.map((opt) => {
                      const sel = selected[cat.category].includes(opt)
                      return (
                        <button
                          key={opt}
                          onClick={() => toggle(cat.category, opt, cat.multi)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                            sel
                              ? cn(categoryStyles[cat.category], 'border-transparent')
                              : 'border-border bg-white/55 text-foreground/55 hover:bg-white/80',
                          )}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-border/60 px-6 pb-6 pt-3">
              {error && (
                <p className="mb-3 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                onClick={submit}
                disabled={!valid || saving}
                className={cn(
                  'w-full rounded-2xl py-3.5 font-semibold transition-colors',
                  valid && !saving
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'cursor-not-allowed bg-primary/30 text-primary-foreground/70',
                )}
              >
                {saving ? 'Adding…' : 'Add skill'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
