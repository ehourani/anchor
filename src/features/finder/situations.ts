import { LifeBuoy, Sparkles, Sprout, Wind, type LucideIcon } from 'lucide-react'

// The four `situation` tags (migration 0003) become the four wheel segments.
// Each carries its on-wheel label, a gentle heading for the filtered view,
// its position on the wheel, and a soft color. Crisis stays warm (coral) so it
// reads as distinct against the cool segments — reachable in one tap, no filtering.
export type SituationMeta = {
  key: string
  /** short label shown on the wheel */
  label: string
  /** gentle title shown on the filtered screen */
  heading: string
  Icon: LucideIcon
  /** center angle on the wheel, in degrees (-90 = top, clockwise) */
  angle: number
  fill: string
  hover: string
  ink: string
}

export const situations: SituationMeta[] = [
  {
    key: 'crisis',
    label: 'In crisis',
    heading: "Let's just get steady",
    Icon: LifeBuoy,
    angle: -90,
    fill: 'hsl(10, 76%, 89%)',
    hover: 'hsl(10, 76%, 84%)',
    ink: 'hsl(8, 50%, 40%)',
  },
  {
    key: 'emotion-regulation',
    label: 'Calm down',
    heading: "Let's soften what you're feeling",
    Icon: Wind,
    angle: 0,
    fill: 'hsl(190, 58%, 86%)',
    hover: 'hsl(190, 58%, 80%)',
    ink: 'hsl(192, 50%, 29%)',
  },
  {
    key: 'distraction',
    label: 'Distract me',
    heading: "Let's shift your focus for a bit",
    Icon: Sparkles,
    angle: 90,
    fill: 'hsl(212, 64%, 89%)',
    hover: 'hsl(212, 62%, 83%)',
    ink: 'hsl(214, 50%, 40%)',
  },
  {
    key: 'life-building',
    label: 'Build a life',
    heading: 'Small things that build you up',
    Icon: Sprout,
    angle: 180,
    fill: 'hsl(150, 44%, 85%)',
    hover: 'hsl(152, 42%, 79%)',
    ink: 'hsl(155, 40%, 27%)',
  },
]
