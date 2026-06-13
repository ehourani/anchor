import { ChevronRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { TagChip } from './TagChip'
import type { Skill } from './sampleSkills'

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Card className="cursor-pointer border-white/70 bg-white/70 shadow-[0_8px_30px_-12px_hsl(200_50%_40%_/_0.25)] backdrop-blur-md transition-all hover:bg-white/85 hover:shadow-[0_12px_36px_-12px_hsl(200_50%_40%_/_0.35)]">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
            {skill.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {skill.blurb}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {skill.tags.map((tag) => (
              <TagChip
                key={`${tag.category}-${tag.label}`}
                category={tag.category}
                label={tag.label}
              />
            ))}
          </div>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  )
}
