import {
  Apple,
  Brain,
  Briefcase,
  Compass,
  Ear,
  Eye,
  Feather,
  Flower2,
  Footprints,
  Globe,
  Hand,
  Home,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Mountain,
  PersonStanding,
  Sparkles,
  Sprout,
  Trees,
  Unlock,
  Users,
  Wind,
  type LucideIcon,
} from 'lucide-react'

import type { TagCategory } from './sampleSkills'

// The seeded, read-only tag vocabulary (migration 0003), as a frontend constant
// for the mockup. Mirrors select-mode + required flags from the schema:
//   situation / setting / senses / modality = multi-select; effort = single.
//   situation / effort / setting = required; senses / modality = optional.
// Effort's order is load-bearing (low < medium < high). Once data is live this
// will come from a `tags` query instead.
//
// Each option carries the storage `slug` (must match `tags.slug` exactly), the
// user-facing `label` we render everywhere, and an icon for the filter bar.
export type TagOption = { slug: string; label: string; Icon: LucideIcon }
export type CategoryMeta = {
  category: TagCategory
  label: string
  multi: boolean
  required: boolean
  options: TagOption[]
}

export const tagVocabulary: CategoryMeta[] = [
  {
    category: 'situation',
    label: 'Situation',
    multi: true,
    required: true,
    options: [
      { slug: 'crisis', label: 'Crisis', Icon: LifeBuoy },
      { slug: 'emotion-regulation', label: 'Emotion regulation', Icon: Wind },
      { slug: 'distraction', label: 'Distraction', Icon: Sparkles },
      { slug: 'life-building', label: 'Life building', Icon: Sprout },
    ],
  },
  {
    category: 'effort',
    label: 'Effort',
    multi: false,
    required: true,
    options: [
      { slug: 'low', label: 'Low Effort', Icon: Feather },
      { slug: 'medium', label: 'Medium Effort', Icon: Footprints },
      { slug: 'high', label: 'High Effort', Icon: Mountain },
    ],
  },
  {
    category: 'setting',
    label: 'Setting',
    multi: true,
    required: true,
    options: [
      { slug: 'anywhere', label: 'Anywhere', Icon: Globe },
      { slug: 'home', label: 'Home', Icon: Home },
      { slug: 'work-or-school', label: 'Work or school', Icon: Briefcase },
      { slug: 'outdoors', label: 'Outdoors', Icon: Trees },
      { slug: 'out-in-public', label: 'Out in public', Icon: Users },
    ],
  },
  {
    category: 'senses',
    label: 'Senses',
    multi: true,
    required: false,
    options: [
      { slug: 'sight', label: 'Sight', Icon: Eye },
      { slug: 'sound', label: 'Sound', Icon: Ear },
      { slug: 'touch', label: 'Touch', Icon: Hand },
      { slug: 'taste', label: 'Taste', Icon: Apple },
      { slug: 'smell', label: 'Smell', Icon: Flower2 },
      { slug: 'movement', label: 'Movement', Icon: PersonStanding },
    ],
  },
  {
    category: 'modality',
    label: 'Approach',
    multi: true,
    required: false,
    // Slugs must match the seeded `tags.slug` exactly (migrations 0003 +
    // 20260613_add_rodbt) — the modality acronyms are stored lowercase.
    options: [
      { slug: 'dbt', label: 'DBT', Icon: Brain },
      { slug: 'cbt', label: 'CBT', Icon: Lightbulb },
      { slug: 'act', label: 'ACT', Icon: Compass },
      { slug: 'mindfulness', label: 'Mindfulness', Icon: Leaf },
      { slug: 'rodbt', label: 'RO-DBT', Icon: Unlock },
    ],
  },
]

const optionByKey = new Map(
  tagVocabulary.flatMap((c) =>
    c.options.map((o) => [`${c.category}:${o.slug}`, o] as const),
  ),
)

// Humanize an unknown slug as a graceful fallback (e.g. "foo-bar" → "Foo bar").
function humanize(slug: string): string {
  const spaced = slug.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// The user-facing label for a (category, slug) tag — what every chip and filter
// renders instead of the raw slug.
export function tagLabel(category: TagCategory, slug: string): string {
  return optionByKey.get(`${category}:${slug}`)?.label ?? humanize(slug)
}

// The icon for a (category, slug) tag, if we have one.
export function tagIcon(
  category: TagCategory,
  slug: string,
): LucideIcon | undefined {
  return optionByKey.get(`${category}:${slug}`)?.Icon
}
