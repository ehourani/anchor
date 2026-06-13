import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill, TagCategory } from './sampleSkills'

// One cache entry per user, so switching accounts never shows stale skills.
export function skillsQueryKey(userId: string | undefined) {
  return ['skills', userId] as const
}

type TagLite = { slug: string; tag_category: string }
type SkillRow = {
  id: string
  title: string
  description: string | null
  crisis_priority: number | null
  // Embedded join: each skill_tags row points at one tag.
  skill_tags: { tags: TagLite | TagLite[] | null }[] | null
}

// DB shape → the UI's Skill. The UI treats Tag.label as the vocabulary *slug*
// (that's what filtering and the chips key on), so we map slug → label.
function toSkill(row: SkillRow): Skill {
  const tags = (row.skill_tags ?? [])
    .map((st) => (Array.isArray(st.tags) ? st.tags[0] : st.tags))
    .filter((t): t is TagLite => t != null)
    .map((t) => ({ category: t.tag_category as TagCategory, label: t.slug }))

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    crisisPriority: row.crisis_priority,
    tags,
  }
}

// The user's skills (with their tags), live from Supabase. RLS scopes rows to
// auth.uid(); the query key is still per-user for correct caching.
export function useSkills() {
  const { user } = useAuth()
  return useQuery({
    queryKey: skillsQueryKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select(
          'id, title, description, crisis_priority, skill_tags(tags(slug, tag_category))',
        )
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as unknown as SkillRow[]).map(toSkill)
    },
  })
}
