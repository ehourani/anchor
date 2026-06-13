import { ChevronRight, Star } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TagChip } from './TagChip'
import { useToggleFavorite } from './useToggleFavorite'
import type { Skill } from './sampleSkills'

export function SkillCard({
  skill,
  onOpen,
}: {
  skill: Skill
  onOpen?: () => void
}) {
  const toggleFavorite = useToggleFavorite()

  return (
    <Card
      onClick={onOpen}
      className="relative cursor-pointer border-white/70 bg-white/70 shadow-[0_8px_30px_-12px_hsl(200_50%_40%_/_0.25)] backdrop-blur-md transition-all hover:bg-white/85 hover:shadow-[0_12px_36px_-12px_hsl(200_50%_40%_/_0.35)]"
    >
      {/* Star floats in the corner where the chevron used to sit; tapping it
          favorites without opening the skill. */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite.mutate({
            skillId: skill.id,
            isFavorite: !skill.isFavorite,
          })
        }}
        aria-pressed={skill.isFavorite}
        aria-label={
          skill.isFavorite ? 'Remove from favorites' : 'Add to favorites'
        }
        className="absolute right-2 top-2 z-10 rounded-full p-1.5 text-foreground/30 transition-colors hover:bg-black/5 hover:text-amber-500"
      >
        <Star
          className={cn(
            'size-5',
            skill.isFavorite && 'fill-amber-400 text-amber-400',
          )}
        />
      </button>

      <CardContent className="flex items-center gap-3 p-4 pr-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="pr-6 font-display text-lg font-semibold leading-snug text-foreground">
            {skill.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {skill.description}
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
        <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
      </CardContent>
    </Card>
  )
}
