import { supabase } from '@/lib/supabase'
import type { Skill, Tag } from './sampleSkills'

export type NewSkillDraft = {
  title: string
  description: string
  tags: Tag[]
}

// Builds a local Skill object — used for the optimistic entry while a real
// insert is in flight, so the new skill appears instantly.
export function createSkill(draft: NewSkillDraft): Skill {
  return {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    crisisPriority: null,
    tags: draft.tags,
  }
}

// The one true write primitive: insert a skill row, then link its tags. Pure
// and dependency-injected (userId + a slug→tag_id resolver) so both the UI add
// flow and the one-time CSV bulk load can share it. Returns the new skill id.
export async function insertSkill(
  draft: NewSkillDraft,
  userId: string,
  resolveTagId: (category: string, slug: string) => string | undefined,
): Promise<string> {
  // Resolve every tag up front so bad vocabulary fails loudly, before we write
  // a half-tagged skill.
  const tagIds = draft.tags.map((t) => {
    const id = resolveTagId(t.category, t.label)
    if (!id) throw new Error(`Unknown tag: ${t.category}/${t.label}`)
    return id
  })

  const { data: inserted, error } = await supabase
    .from('skills')
    .insert({
      user_id: userId,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
    })
    .select('id')
    .single()
  if (error) throw error

  if (tagIds.length > 0) {
    const { error: linkError } = await supabase
      .from('skill_tags')
      .insert(tagIds.map((tag_id) => ({ skill_id: inserted.id, tag_id })))
    if (linkError) throw linkError
  }

  return inserted.id
}
