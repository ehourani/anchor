import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, LifeBuoy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TagChip } from './TagChip'
import { useSkills } from './useSkills'
import {
  nextCrisisPriority,
  useSetCrisisMembership,
} from './useSetCrisisMembership'
import type { Skill, Tag, TagCategory } from './sampleSkills'

// Most useful first: what it's for, how much it takes, then the rest.
const TAG_ORDER: TagCategory[] = ['situation', 'effort', 'setting', 'senses', 'modality']
const TAG_GAP_PX = 6 // matches gap-1.5

function MoreChip({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-medium text-foreground/50">
      +{count} more
    </span>
  )
}

// One line of tags. Every tag is rendered off-screen to measure it; as many as
// fit are shown, and the rest are summarized as "+N more" (the full set is on
// the skill's detail view). Re-measures when the card resizes.
function TagLine({ tags }: { tags: Tag[] }) {
  const sorted = useMemo(
    () =>
      [...tags].sort(
        (a, b) => TAG_ORDER.indexOf(a.category) - TAG_ORDER.indexOf(b.category),
      ),
    [tags],
  )
  const rowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(sorted.length)

  useLayoutEffect(() => {
    const row = rowRef.current
    const measure = measureRef.current
    if (!row || !measure) return

    const fit = () => {
      const available = row.clientWidth
      const nodes = Array.from(measure.children) as HTMLElement[]
      const more = nodes.pop() // the sample "+N more" chip, measured last
      const widths = nodes.map((n) => n.offsetWidth)
      const total =
        widths.reduce((sum, w) => sum + w, 0) + TAG_GAP_PX * (widths.length - 1)
      // Unmeasurable (e.g. not laid out yet) or everything fits: show all.
      if (available === 0 || total <= available) {
        setVisible(sorted.length)
        return
      }
      let used = more?.offsetWidth ?? 0
      let count = 0
      for (const w of widths) {
        if (used + TAG_GAP_PX + w > available) break
        used += TAG_GAP_PX + w
        count++
      }
      setVisible(count)
    }

    fit()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(fit)
    observer.observe(row)
    return () => observer.disconnect()
  }, [sorted])

  if (sorted.length === 0) return null
  const hidden = sorted.length - visible

  return (
    <div className="relative">
      <div ref={rowRef} className="flex flex-nowrap gap-1.5 overflow-hidden">
        {sorted.slice(0, visible).map((tag) => (
          <TagChip
            key={`${tag.category}-${tag.label}`}
            category={tag.category}
            label={tag.label}
          />
        ))}
        {hidden > 0 && <MoreChip count={hidden} />}
      </div>
      {/* Invisible measuring copy: every chip at natural width, plus a sample
          "+N more" chip sized for the widest likely count. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute left-0 top-0 flex w-max gap-1.5"
      >
        {sorted.map((tag) => (
          <TagChip
            key={`${tag.category}-${tag.label}`}
            category={tag.category}
            label={tag.label}
          />
        ))}
        <MoreChip count={sorted.length} />
      </div>
    </div>
  )
}

export function SkillCard({
  skill,
  onOpen,
}: {
  skill: Skill
  onOpen?: () => void
}) {
  const setCrisis = useSetCrisisMembership()
  // The full toolkit, to place a newly-added anchor at the end of the distress set.
  const { data: allSkills = [] } = useSkills()
  const inCrisisSet = skill.crisisPriority !== null

  return (
    <Card
      onClick={onOpen}
      className="relative cursor-pointer border-white/70 bg-white/70 shadow-[0_8px_30px_-12px_hsl(200_50%_40%_/_0.25)] backdrop-blur-md transition-all hover:bg-white/85 hover:shadow-[0_12px_36px_-12px_hsl(200_50%_40%_/_0.35)]"
    >
      {/* Buoy floats in the corner; tapping it adds/removes this anchor from
          the distress set without opening it. */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setCrisis.mutate({
            skillId: skill.id,
            priority: inCrisisSet ? null : nextCrisisPriority(allSkills),
          })
        }}
        aria-pressed={inCrisisSet}
        aria-label={
          inCrisisSet
            ? `Remove ${skill.title} from your distress set`
            : `Add ${skill.title} to your distress set`
        }
        className={cn(
          'absolute right-2 top-2 z-10 rounded-full p-1.5 transition-colors',
          inCrisisSet
            ? 'bg-[hsl(10,76%,93%)] text-[hsl(8,58%,52%)] hover:bg-[hsl(10,76%,89%)]'
            : 'text-foreground/30 hover:bg-black/5 hover:text-[hsl(8,58%,52%)]',
        )}
      >
        <LifeBuoy className="size-5" />
      </button>

      <CardContent className="flex items-center gap-3 p-4 pr-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="pr-8 font-display text-lg font-semibold leading-snug text-foreground">
            {skill.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {skill.description}
          </p>
          <div className="pt-0.5">
            <TagLine tags={skill.tags} />
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  )
}
