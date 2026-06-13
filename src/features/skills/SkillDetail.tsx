import { useState } from 'react'
import { Check, LifeBuoy } from 'lucide-react'

import { logSkillUse, type Helpfulness } from '@/features/logging/logging'
import { LogReflection } from '@/features/logging/LogReflection'
import { TagChip } from './TagChip'
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
}: {
  skill: Skill
  onDone: () => void
}) {
  const [logged, setLogged] = useState(false)
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null)
  const [note, setNote] = useState('')

  // Logging is instant; the reflection below is optional and can be edited freely.
  const handleLog = () => {
    setLogged(true)
    void logSkillUse({ skillId: skill.id, helpfulness: null, note: '' })
  }

  const saveReflection = (
    nextHelpfulness: Helpfulness | null,
    nextNote: string,
  ) => {
    setHelpfulness(nextHelpfulness)
    setNote(nextNote)
    void logSkillUse({
      skillId: skill.id,
      helpfulness: nextHelpfulness,
      note: nextNote,
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-5">
        {skill.crisisPriority !== null && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[hsl(10,76%,93%)] px-2.5 py-1 text-xs font-semibold text-[hsl(8,50%,42%)]">
            <LifeBuoy className="size-3.5" />
            In your crisis set
          </span>
        )}
        <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-foreground">
          {skill.title}
        </h1>
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
        <button
          onClick={handleLog}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          I used this
        </button>
      )}
    </div>
  )
}
