import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Plus, ScrollText, Search, X } from 'lucide-react'

import type { Skill } from '@/features/skills/sampleSkills'
import { useSkillUsageStats } from '@/features/history/useSkillUsageStats'
import { type Helpfulness } from './logging'
import { useUsageLogger } from './useUsageLogger'
import { LogReflection } from './LogReflection'

// Quick "I used an anchor" sheet, opened from the Reflect tab. Search or pick
// an anchor → it logs instantly → optional, skippable reflection. Past
// reflections are one tap away from the picker.
export function LogSheet({
  open,
  onClose,
  skills,
  onViewReflections,
  onAddNew,
}: {
  open: boolean
  onClose: () => void
  skills: Skill[]
  onViewReflections: () => void
  onAddNew: () => void
}) {
  const [skillId, setSkillId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null)
  const [note, setNote] = useState('')
  const { startLog, saveReflection: persistReflection } = useUsageLogger()
  const usageStats = useSkillUsageStats()

  // Most recently used skills first (the likely pick is on top), then the rest
  // alphabetically. ISO timestamps compare chronologically as plain strings.
  const ordered = useMemo(() => {
    return [...skills].sort((a, b) => {
      const ta = usageStats.get(a.id)?.lastUsedAt
      const tb = usageStats.get(b.id)?.lastUsedAt
      if (ta && tb) return tb.localeCompare(ta)
      if (ta) return -1
      if (tb) return 1
      return a.title.localeCompare(b.title)
    })
  }, [skills, usageStats])

  // Title search over the already-loaded anchors; no extra queries.
  const needle = query.trim().toLowerCase()
  const results = needle
    ? ordered.filter((s) => s.title.toLowerCase().includes(needle))
    : ordered

  // Fresh start each time the sheet opens.
  useEffect(() => {
    if (open) {
      setSkillId(null)
      setQuery('')
      setHelpfulness(null)
      setNote('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const selected = skills.find((s) => s.id === skillId) ?? null

  const pick = (id: string) => {
    setSkillId(id)
    startLog(id)
  }

  // Close this sheet, then hand off (to history, or to the Add an Anchor sheet).
  const leaveTo = (fn: () => void) => () => {
    onClose()
    fn()
  }

  const saveReflection = (h: Helpfulness | null, n: string) => {
    setHelpfulness(h)
    setNote(n)
    if (skillId) persistReflection(h, n)
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
        aria-label="Log an anchor you used"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {selected ? selected.title : 'Which anchor did you use?'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          {!selected && (
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your anchors"
                aria-label="Search your anchors"
                className="w-full rounded-xl border border-border bg-white/70 py-2.5 pl-10 pr-10 text-base text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-foreground/45 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-3">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
                <Check className="size-5" />
                <span className="font-semibold">Logged ✔️</span>
              </div>
              <LogReflection
                helpfulness={helpfulness}
                note={note}
                onChange={saveReflection}
              />
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {results.length === 0 && needle && (
                <div className="rounded-2xl border border-white/70 bg-white/60 p-5 text-center">
                  <p className="text-sm text-foreground/60">
                    No anchors match “{query.trim()}”.
                  </p>
                  <button
                    onClick={leaveTo(onAddNew)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Plus className="size-4" />
                    Add a new anchor
                  </button>
                </div>
              )}
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 text-left transition-colors hover:bg-white"
                >
                  <span className="font-semibold text-foreground">
                    {s.title}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-foreground/40" />
                </button>
              ))}
              <button
                onClick={leaveTo(onViewReflections)}
                className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-foreground/55 transition-colors hover:bg-white/60 hover:text-foreground"
              >
                <ScrollText className="size-4" />
                See past reflections
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
