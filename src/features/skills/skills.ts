import type { Skill, Tag } from './sampleSkills'

// The create-skill path. For now it just builds a local Skill object so the
// add flow works against in-memory mockup data. Once auth + live data are in,
// this becomes an insert into `skills` (+ `skill_tags`) followed by query
// invalidation — the single seam to swap.
export type NewSkillDraft = {
  title: string
  description: string
  tags: Tag[]
}

export function createSkill(draft: NewSkillDraft): Skill {
  return {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    crisisPriority: null,
    tags: draft.tags,
  }
}
