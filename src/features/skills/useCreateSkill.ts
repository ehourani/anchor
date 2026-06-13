import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill } from './sampleSkills'
import { createSkill, insertSkill, type NewSkillDraft } from './skills'
import { skillsQueryKey } from './useSkills'
import { fetchTags, tagIdResolver, tagsQueryKey } from './useTags'

// Adds a skill: optimistic in the cache so it appears instantly, then a real
// insert (skill + skill_tags), reconciled by invalidating on settle.
export function useCreateSkill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = skillsQueryKey(user?.id)

  return useMutation({
    mutationFn: async (draft: NewSkillDraft) => {
      if (!user) throw new Error('You need to be signed in to add a skill.')
      // Cached after the first add; the vocabulary is global and static.
      const tags = await queryClient.fetchQuery({
        queryKey: tagsQueryKey,
        queryFn: fetchTags,
        staleTime: Infinity,
      })
      return insertSkill(draft, user.id, tagIdResolver(tags))
    },
    onMutate: async (draft) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Skill[]>(key)
      queryClient.setQueryData<Skill[]>(key, (old) => [
        ...(old ?? []),
        createSkill(draft),
      ])
      return { prev }
    },
    onError: (_err, _draft, ctx) => {
      // Put the list back the way it was if the write failed.
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
