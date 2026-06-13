import { cn } from '@/lib/utils'
import type { TagCategory } from './sampleSkills'

// One soft pastel hue per taxonomy category, so tags read at a glance without
// shouting. Tone deliberately gentle — these are quiet labels, not alerts.
const categoryStyles: Record<TagCategory, string> = {
  situation: 'bg-[hsl(205,55%,94%)] text-[hsl(205,42%,38%)]',
  effort: 'bg-[hsl(36,62%,92%)] text-[hsl(30,52%,38%)]',
  setting: 'bg-[hsl(146,38%,92%)] text-[hsl(150,34%,30%)]',
  senses: 'bg-[hsl(266,44%,94%)] text-[hsl(266,34%,46%)]',
  modality: 'bg-[hsl(340,52%,95%)] text-[hsl(340,42%,46%)]',
}

export function TagChip({
  category,
  label,
}: {
  category: TagCategory
  label: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        categoryStyles[category],
      )}
    >
      {label}
    </span>
  )
}
