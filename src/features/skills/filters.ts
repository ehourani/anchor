import type { Skill, TagCategory } from './sampleSkills'

// A set of active filters, by category. Within a category the selected tags are
// OR'd (any match); across categories they're AND'd (must match each). Effort is
// single-select when authoring a skill, but filtering by several efforts at once
// is fine, so every category is multi here.
export type Filters = Record<TagCategory, string[]>

export function emptyFilters(): Filters {
  return { situation: [], effort: [], setting: [], senses: [], modality: [] }
}

export function toggleFilter(
  filters: Filters,
  category: TagCategory,
  slug: string,
): Filters {
  const current = filters[category]
  return {
    ...filters,
    [category]: current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug],
  }
}

export function countFilters(filters: Filters): number {
  return Object.values(filters).reduce((n, slugs) => n + slugs.length, 0)
}

// A skill passes when, for every category that has any selection, it carries at
// least one of the selected tags (OR within, AND across).
export function matchesFilters(skill: Skill, filters: Filters): boolean {
  return (Object.keys(filters) as TagCategory[]).every((category) => {
    const selected = filters[category]
    if (selected.length === 0) return true
    return selected.some((slug) =>
      skill.tags.some((t) => t.category === category && t.label === slug),
    )
  })
}
