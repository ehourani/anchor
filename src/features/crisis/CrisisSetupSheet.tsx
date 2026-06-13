import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Skill } from '@/features/skills/sampleSkills'
import {
  nextCrisisPriority,
  useSetCrisisMembership,
} from '@/features/skills/useSetCrisisMembership'

// Choose which skills belong in the crisis set. Tapping a skill adds/removes it
// instantly (optimistic) — no separate save. Members sort first; reordering
// within the set is a planned follow-up.
export function CrisisSetupSheet({
  open,
  onClose,
  skills,
}: {
  open: boolean
  onClose: () => void
  skills: Skill[]
}) {
  const setMembership = useSetCrisisMembership()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Members first (by rank), then the rest alphabetically.
  const ordered = [...skills].sort((a, b) => {
    const am = a.crisisPriority != null
    const bm = b.crisisPriority != null
    if (am && bm) return (a.crisisPriority ?? 0) - (b.crisisPriority ?? 0)
    if (am) return -1
    if (bm) return 1
    return a.title.localeCompare(b.title)
  })

  const toggle = (skill: Skill) => {
    setMembership.mutate({
      skillId: skill.id,
      priority: skill.crisisPriority != null ? null : nextCrisisPriority(skills),
    })
  }

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
        aria-label="Choose your crisis skills"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Your crisis skills
              </h2>
              <p className="mt-0.5 text-sm text-foreground/55">
                Pick the ones you'll want close in a hard moment.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Done"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 pb-8 pt-3">
          {ordered.map((s) => {
            const inSet = s.crisisPriority != null
            return (
              <button
                key={s.id}
                onClick={() => toggle(s)}
                aria-pressed={inSet}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors',
                  inSet
                    ? 'border-transparent bg-[hsl(10,76%,93%)]'
                    : 'border-white/70 bg-white/70 hover:bg-white',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    inSet
                      ? 'border-transparent bg-[hsl(8,64%,58%)] text-white'
                      : 'border-foreground/25 text-transparent',
                  )}
                >
                  {inSet ? <Check className="size-4" /> : <Plus className="size-4 text-foreground/40" />}
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    inSet ? 'text-[hsl(8,50%,38%)]' : 'text-foreground',
                  )}
                >
                  {s.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body,
  )
}
