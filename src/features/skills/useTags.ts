import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

// The global, seeded, read-only tag vocabulary. Shared by every user, so it's
// keyed without a user id and effectively never goes stale in a session.
export const tagsQueryKey = ['tags'] as const

export type TagRow = { id: string; slug: string; tag_category: string }

export async function fetchTags(): Promise<TagRow[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, slug, tag_category')
  if (error) throw error
  return data
}

// A resolver from a draft tag (category slug + tag slug) to its real tag_id.
export function tagIdResolver(tags: TagRow[]) {
  const byKey = new Map(tags.map((t) => [`${t.tag_category}:${t.slug}`, t.id]))
  return (category: string, slug: string) => byKey.get(`${category}:${slug}`)
}

export function useTags() {
  return useQuery({
    queryKey: tagsQueryKey,
    queryFn: fetchTags,
    staleTime: Infinity,
  })
}
