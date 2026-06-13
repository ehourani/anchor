import type { TagCategory } from './sampleSkills'

// The seeded, read-only tag vocabulary (migration 0003), as a frontend constant
// for the mockup. Mirrors select-mode + required flags from the schema:
//   situation / setting / senses / modality = multi-select; effort = single.
//   situation / effort / setting = required; senses / modality = optional.
// Effort's order is load-bearing (low < medium < high). Once data is live this
// will come from a `tags` query instead.
export type CategoryMeta = {
  category: TagCategory
  label: string
  multi: boolean
  required: boolean
  options: string[]
}

export const tagVocabulary: CategoryMeta[] = [
  {
    category: 'situation',
    label: 'Situation',
    multi: true,
    required: true,
    options: ['crisis', 'emotion-regulation', 'distraction', 'life-building'],
  },
  {
    category: 'effort',
    label: 'Effort',
    multi: false,
    required: true,
    options: ['low', 'medium', 'high'],
  },
  {
    category: 'setting',
    label: 'Setting',
    multi: true,
    required: true,
    options: ['anywhere', 'home', 'work-or-school', 'outdoors', 'out-in-public'],
  },
  {
    category: 'senses',
    label: 'Senses',
    multi: true,
    required: false,
    options: ['sight', 'sound', 'touch', 'taste', 'smell', 'movement'],
  },
  {
    category: 'modality',
    label: 'Approach',
    multi: true,
    required: false,
    options: ['DBT', 'CBT', 'ACT', 'mindfulness'],
  },
]
