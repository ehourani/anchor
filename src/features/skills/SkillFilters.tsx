import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TagCategory } from './sampleSkills'
import { categoryStyles } from './TagChip'
import { tagIcon, tagLabel, tagVocabulary } from './tagVocabulary'
import {
  countFilters,
  emptyFilters,
  toggleFilter,
  type Filters,
} from './filters'

// The filters surfaced inline, in priority order: low-effort first, then the
// most useful settings. Everything else lives behind "All filters".
const QUICK: { category: TagCategory; slug: string }[] = [
  { category: 'effort', slug: 'low' },
  { category: 'setting', slug: 'anywhere' },
  { category: 'setting', slug: 'home' },
  { category: 'setting', slug: 'out-in-public' },
]

function FilterChip({
  category,
  slug,
  active,
  onToggle,
}: {
  category: TagCategory
  slug: string
  active: boolean
  onToggle: () => void
}) {
  const Icon = tagIcon(category, slug)
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? cn(categoryStyles[category], 'border-transparent')
          : 'border-border bg-white/55 text-foreground/60 hover:bg-white/80',
      )}
    >
      {Icon && <Icon className="size-4" />}
      {tagLabel(category, slug)}
    </button>
  )
}

export function SkillFilters({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (next: Filters) => void
}) {
  const [allOpen, setAllOpen] = useState(false)
  const active = countFilters(filters)
  const toggle = (category: TagCategory, slug: string) =>
    onChange(toggleFilter(filters, category, slug))

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {QUICK.map((q) => (
          <FilterChip
            key={`${q.category}-${q.slug}`}
            category={q.category}
            slug={q.slug}
            active={filters[q.category].includes(q.slug)}
            onToggle={() => toggle(q.category, q.slug)}
          />
        ))}
        <button
          onClick={() => setAllOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white/55 px-3 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-white/80"
        >
          <SlidersHorizontal className="size-4" />
          All filters
          {active > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {active}
            </span>
          )}
        </button>
        {active > 0 && (
          <button
            onClick={() => onChange(emptyFilters())}
            className="text-sm font-medium text-foreground/45 transition-colors hover:text-foreground/75"
          >
            Clear
          </button>
        )}
      </div>

      <AllFiltersSheet
        open={allOpen}
        onClose={() => setAllOpen(false)}
        filters={filters}
        onChange={onChange}
      />
    </>
  )
}

function AllFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
}: {
  open: boolean
  onClose: () => void
  filters: Filters
  onChange: (next: Filters) => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const active = countFilters(filters)

  // Portaled to <body>: the list views animate with a transform, which would
  // otherwise become the containing block for these fixed elements and pin the
  // sheet to the bottom of the scrolled content instead of the viewport.
  return createPortal(
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
        aria-label="All filters"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Filter skills
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

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-4 pt-2">
          {tagVocabulary.map((cat) => (
            <div key={cat.category}>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                {cat.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cat.options.map((opt) => (
                  <FilterChip
                    key={opt.slug}
                    category={cat.category}
                    slug={opt.slug}
                    active={filters[cat.category].includes(opt.slug)}
                    onToggle={() =>
                      onChange(toggleFilter(filters, cat.category, opt.slug))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-border/60 px-6 pb-6 pt-3">
          <div className="flex gap-2.5">
            {active > 0 && (
              <button
                onClick={() => onChange(emptyFilters())}
                className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3.5 font-semibold text-foreground/75 transition-colors hover:bg-white hover:text-foreground"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {active > 0 ? `Show results` : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
