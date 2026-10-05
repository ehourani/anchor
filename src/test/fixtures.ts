import type { Skill, Tag, TagCategory } from '@/features/skills/sampleSkills'

// Shorthand for tags: tag('situation', 'crisis').
export function tag(category: TagCategory, label: string): Tag {
  return { category, label }
}

let nextId = 1

// A skill with sensible defaults; override only what a test cares about.
export function makeSkill(overrides: Partial<Skill> = {}): Skill {
  const id = overrides.id ?? `skill-${nextId++}`
  return {
    id,
    title: `Skill ${id}`,
    description: '',
    crisisPriority: null,
    isFavorite: false,
    tags: [],
    ...overrides,
  }
}
