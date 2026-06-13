import { useState } from 'react'
import { ChevronRight, Heart, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Skill } from '@/features/skills/sampleSkills'
import { useToggleFavorite } from '@/features/skills/useToggleFavorite'
import { SupportLinks } from './SupportLinks'
import { CrisisSetupSheet } from './CrisisSetupSheet'

// Crisis mode: a calm, no-filtering surface that drops straight onto your
// steadying skills in priority order, with support contacts always at the
// bottom. Membership is a non-null crisis_priority (seeded on signup, so it's
// never empty for a new user); the edit icon opens the setup sheet.
export function CrisisScreen({
  skills,
  onOpenSkill,
}: {
  skills: Skill[]
  onOpenSkill: (id: string) => void
}) {
  const [setupOpen, setSetupOpen] = useState(false)
  const toggleFavorite = useToggleFavorite()

  const crisisSkills = skills
    .filter((s) => s.crisisPriority != null)
    .sort((a, b) => (a.crisisPriority ?? 0) - (b.crisisPriority ?? 0))

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[hsl(8,50%,46%)]">
            In crisis
          </p>
          <h1 className="mt-1 font-display text-[1.7rem] font-semibold leading-tight text-foreground">
            Let's just get steady
          </h1>
        </div>
        <button
          onClick={() => setSetupOpen(true)}
          aria-label="Edit your crisis skills"
          className="-mr-1 mt-0.5 shrink-0 rounded-full p-2 text-foreground/35 transition-colors hover:bg-white/60 hover:text-foreground"
        >
          <Pencil className="size-5" />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {crisisSkills.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center backdrop-blur-md">
            <p className="text-sm text-foreground/65">
              Your crisis set is empty. Add a few steadying skills so they're
              ready when you need them most.
            </p>
            <button
              onClick={() => setSetupOpen(true)}
              className="mt-4 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Choose your skills
            </button>
          </div>
        ) : (
          crisisSkills.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpenSkill(s.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 text-left shadow-[0_8px_30px_-12px_hsl(200_50%_40%_/_0.25)] backdrop-blur-md transition-colors hover:bg-white"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground/65">
                  {s.description}
                </p>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite.mutate({
                    skillId: s.id,
                    isFavorite: !s.isFavorite,
                  })
                }}
                role="button"
                aria-pressed={s.isFavorite}
                aria-label={
                  s.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                className="shrink-0 rounded-full p-1.5 text-foreground/30 transition-colors hover:bg-black/5 hover:text-red-400"
              >
                <Heart
                  className={cn(
                    'size-5',
                    s.isFavorite && 'fill-red-500 text-red-500',
                  )}
                />
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
            </button>
          ))
        )}
      </div>

      <div className="flex-1" />

      {/* Support is always reachable from crisis mode. */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/40">
          If you need to talk to someone
        </p>
        <SupportLinks />
      </div>

      <CrisisSetupSheet
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        skills={skills}
      />
    </div>
  )
}
