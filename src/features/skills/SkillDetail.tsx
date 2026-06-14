import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight, Heart, LifeBuoy, Pencil, Trash2 } from 'lucide-react'

import { type Helpfulness } from '@/features/logging/logging'
import { useUsageLogger } from '@/features/logging/useUsageLogger'
import { LogReflection } from '@/features/logging/LogReflection'
import { useUsageLogs } from '@/features/history/useUsageLogs'
import { TagChip } from './TagChip'
import { useToggleFavorite } from './useToggleFavorite'
import { useDeleteSkill } from './useDeleteSkill'
import { useSkills } from './useSkills'
import {
  nextCrisisPriority,
  useSetCrisisMembership,
} from './useSetCrisisMembership'
import type { Skill, TagCategory } from './sampleSkills'

// Tag categories grouped for the detail view, in a friendly reading order.
const groups: { category: TagCategory; label: string }[] = [
  { category: 'situation', label: 'Good for' },
  { category: 'effort', label: 'Effort' },
  { category: 'setting', label: 'Where' },
  { category: 'senses', label: 'Senses' },
  { category: 'modality', label: 'Approach' },
]

export function SkillDetail({
  skill,
  onDone,
  onViewHistory,
  onEdit,
  onDeleted,
}: {
  skill: Skill
  onDone: () => void
  onViewHistory: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const [logged, setLogged] = useState(false)
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null)
  const [note, setNote] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { startLog, saveReflection: persistReflection } = useUsageLogger()
  const toggleFavorite = useToggleFavorite()
  const deleteSkill = useDeleteSkill()
  const setCrisis = useSetCrisisMembership()
  // The full toolkit, to place a newly-added skill at the end of the crisis set.
  const { data: allSkills = [] } = useSkills()
  const inCrisisSet = skill.crisisPriority !== null

  // Optimistic delete: drop it and leave the detail view at once, so it feels
  // immediate. A rare failure rolls the skill back in the list behind us.
  const handleDelete = () => {
    deleteSkill.mutate(skill.id)
    setConfirmingDelete(false)
    onDeleted()
  }
  // Powers the "past uses" link below; this query is shared (same key) with the
  // skill-history view it navigates to, so that view opens already-cached.
  const { data: pastLogs = [] } = useUsageLogs(skill.id)
  const hasHistory = pastLogs.length > 0

  // Logging is instant; the reflection below is optional and can be edited freely.
  const handleLog = () => {
    setLogged(true)
    startLog(skill.id)
  }

  const saveReflection = (
    nextHelpfulness: Helpfulness | null,
    nextNote: string,
  ) => {
    setHelpfulness(nextHelpfulness)
    setNote(nextNote)
    persistReflection(nextHelpfulness, nextNote)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {skill.crisisPriority !== null && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[hsl(10,76%,93%)] px-2.5 py-1 text-xs font-semibold text-[hsl(8,50%,42%)]">
                <LifeBuoy className="size-3.5" />
                In your crisis set
              </span>
            )}
            <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-foreground">
              {skill.title}
            </h1>
          </div>
          <div className="-mr-1 mt-0.5 flex shrink-0 items-center gap-0.5">
            <button
              onClick={() =>
                setCrisis.mutate({
                  skillId: skill.id,
                  priority: inCrisisSet ? null : nextCrisisPriority(allSkills),
                })
              }
              aria-pressed={inCrisisSet}
              aria-label={
                inCrisisSet ? 'Remove from crisis set' : 'Add to crisis set'
              }
              className={`rounded-full p-2 transition-colors hover:bg-white/60 ${
                inCrisisSet
                  ? 'text-[hsl(8,58%,52%)]'
                  : 'text-foreground/35 hover:text-[hsl(8,58%,52%)]'
              }`}
            >
              <LifeBuoy className="size-6" />
            </button>
            <button
              onClick={onEdit}
              aria-label="Edit skill"
              className="rounded-full p-2 text-foreground/35 transition-colors hover:bg-white/60 hover:text-foreground"
            >
              <Pencil className="size-5" />
            </button>
            <button
              onClick={() =>
                toggleFavorite.mutate({
                  skillId: skill.id,
                  isFavorite: !skill.isFavorite,
                })
              }
              aria-pressed={skill.isFavorite}
              aria-label={
                skill.isFavorite ? 'Remove from favorites' : 'Add to favorites'
              }
              className="rounded-full p-2 text-foreground/35 transition-colors hover:bg-white/60 hover:text-red-400"
            >
              <Heart
                className={
                  skill.isFavorite
                    ? 'size-6 fill-red-500 text-red-500'
                    : 'size-6'
                }
              />
            </button>
          </div>
        </div>
        <p className="mt-2 text-[0.97rem] leading-relaxed text-foreground/70">
          {skill.description}
        </p>
      </div>

      <div className="mt-5 space-y-4 rounded-2xl border border-white/60 bg-white/55 p-5 backdrop-blur-md">
        {groups.map((group) => {
          const tags = skill.tags.filter((t) => t.category === group.category)
          if (!tags.length) return null
          return (
            <div key={group.category}>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                {group.label}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <TagChip key={t.label} category={t.category} label={t.label} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1" />

      {logged ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
            <Check className="size-5" />
            <span className="font-semibold">Logged — gently done.</span>
          </div>

          {/* Optional, skippable reflection — never required, never a score. */}
          <LogReflection
            helpfulness={helpfulness}
            note={note}
            onChange={saveReflection}
          />

          <button
            onClick={onDone}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleLog}
            className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            I used this
          </button>
          {hasHistory && (
            <button
              onClick={onViewHistory}
              className="flex w-full items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/70 py-3 font-semibold text-foreground/75 shadow-sm transition-colors hover:bg-white hover:text-foreground"
            >
              See your reflections
              <ChevronRight className="size-4" />
            </button>
          )}
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mx-auto mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/40 transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Remove this skill
          </button>
        </div>
      )}

      {confirmingDelete &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm"
              onClick={() => setConfirmingDelete(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Remove this skill"
              className="animate-fade-rise fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)]"
            >
              <h2 className="font-display text-lg font-semibold text-foreground">
                Remove “{skill.title}”?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                It'll be taken out of your toolkit, along with its reflections,
                and can't be undone.
              </p>
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={handleDelete}
                  className="w-full rounded-2xl bg-destructive py-3.5 font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                >
                  Remove skill
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="w-full rounded-2xl border border-white/70 bg-white/70 py-3 font-semibold text-foreground/75 transition-colors hover:bg-white hover:text-foreground"
                >
                  Keep it
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
