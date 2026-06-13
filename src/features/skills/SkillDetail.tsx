import { useState } from 'react'
import { Check, LifeBuoy } from 'lucide-react'

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

export function SkillDetail({ skill }: { skill: Skill }) {
  // Optimistic, instant, no pressure — a placeholder for the logging flow.
  const [logged, setLogged] = useState(false)

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
          {skill.blurb}
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
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
          <Check className="size-5" />
          <span className="font-semibold">Logged — gently done.</span>
        </div>
      ) : (
        <button
          onClick={() => setLogged(true)}
          className="mt-6 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          I used this
        </button>
      )}
    </div>
  )
}
