import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, LifeBuoy } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { TagChip } from './TagChip'
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
    // overflow-hidden keeps the w-max measuring copy from widening the page
    // (which made mobile browsers zoom out and push fixed sheets off-screen).
    <div className="relative overflow-hidden">
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
  const inCrisisSet = skill.crisisPriority !== null
  // The buoy already says "distress", so drop the redundant Distress tag on
  // cards that show it (the detail view still lists every tag).
  const cardTags = useMemo(
    () =>
      inCrisisSet
        ? skill.tags.filter((t) => !(t.category === 'situation' && t.label === 'crisis'))
        : skill.tags,
    [skill.tags, inCrisisSet],
  )

  return (
    <Card
      onClick={onOpen}
      className="relative cursor-pointer border-white/70 bg-white/70 shadow-[0_8px_30px_-12px_hsl(200_50%_40%_/_0.25)] backdrop-blur-md transition-all hover:bg-white/85 hover:shadow-[0_12px_36px_-12px_hsl(200_50%_40%_/_0.35)]"
    >
      {/* A quiet buoy marks anchors in the distress set. Membership is
          changed from the anchor's detail view or distress mode. */}
      {inCrisisSet && (
        <span
          role="img"
          aria-label="In your distress set"
          className="absolute right-2.5 top-2.5 rounded-full bg-[hsl(10,76%,93%)] p-1.5 text-[hsl(8,58%,52%)]"
        >
          <LifeBuoy className="size-4" aria-hidden="true" />
        </span>
      )}

      <CardContent className="flex items-center gap-3 p-4 pr-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="pr-8 font-display text-lg font-semibold leading-snug text-foreground">
            {skill.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {skill.description}
          </p>
          <div className="pt-0.5">
            <TagLine tags={cardTags} />
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  )
}
