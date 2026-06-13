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
    isFavorite: false,
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

// Edit an existing skill: update its fields, then reconcile its tag links by
// diffing the desired set against what's stored (insertSkill only ever adds, so
// edits need the delete side too). Like insertSkill, this is several non-
// transactional requests — an atomic RPC is tracked in the backlog. RLS scopes
// every write to the owner.
export async function updateSkill(
  skillId: string,
  draft: NewSkillDraft,
  resolveTagId: (category: string, slug: string) => string | undefined,
): Promise<void> {
  // Resolve the target tags up front so bad vocabulary fails before any write.
  const nextTagIds = draft.tags.map((t) => {
    const id = resolveTagId(t.category, t.label)
    if (!id) throw new Error(`Unknown tag: ${t.category}/${t.label}`)
    return id
  })

  const { error: updateError } = await supabase
    .from('skills')
    .update({
      title: draft.title.trim(),
      description: draft.description.trim() || null,
    })
    .eq('id', skillId)
  if (updateError) throw updateError

  const { data: existing, error: readError } = await supabase
    .from('skill_tags')
    .select('tag_id')
    .eq('skill_id', skillId)
  if (readError) throw readError

  const existingIds = new Set((existing ?? []).map((r) => r.tag_id))
  const nextIds = new Set(nextTagIds)
  const toAdd = nextTagIds.filter((id) => !existingIds.has(id))
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id))

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('skill_tags')
      .delete()
      .eq('skill_id', skillId)
      .in('tag_id', toRemove)
    if (error) throw error
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('skill_tags')
      .insert(toAdd.map((tag_id) => ({ skill_id: skillId, tag_id })))
    if (error) throw error
  }
}

// Flip a skill's favorite flag. RLS scopes the update to the owner; we don't
// pass user_id since the WHERE on id plus the policy is enough.
export async function setFavorite(
  skillId: string,
  isFavorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('skills')
    .update({ is_favorite: isFavorite })
    .eq('id', skillId)
  if (error) throw error
}

// Delete a skill. Its skill_tags and usage_logs cascade-delete in the DB (see
// migration 0001 foreign keys), so its history goes with it. RLS scopes the
// delete to the owner.
export async function deleteSkill(skillId: string): Promise<void> {
  const { error } = await supabase.from('skills').delete().eq('id', skillId)
  if (error) throw error
}

// Set (or clear) a skill's crisis priority. Membership in the crisis set IS
// having a non-null priority; the value is its rank (lower = shown first). Pass
// null to remove it from the set. RLS scopes the update to the owner.
export async function setCrisisPriority(
  skillId: string,
  priority: number | null,
): Promise<void> {
  const { error } = await supabase
    .from('skills')
    .update({ crisis_priority: priority })
    .eq('id', skillId)
  if (error) throw error
}

// Rewrite the crisis set's order: assign priorities 1..n in the given sequence.
// Like the other writes here this is several non-transactional requests (atomic
// RPC is backlogged); RLS scopes every update to the owner.
export async function setCrisisOrder(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from('skills').update({ crisis_priority: i + 1 }).eq('id', id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
