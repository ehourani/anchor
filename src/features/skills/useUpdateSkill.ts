import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill } from './sampleSkills'
import { updateSkill, type NewSkillDraft } from './skills'
import { skillsQueryKey } from './useSkills'
import { fetchTags, tagIdResolver, tagsQueryKey } from './useTags'

// Edits a skill: optimistically patches the cached skill so the change shows
// instantly, then reconciles by invalidating on settle. Mirrors useCreateSkill.
export function useUpdateSkill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = skillsQueryKey(user?.id)

  return useMutation({
    mutationFn: async ({
      skillId,
      draft,
    }: {
      skillId: string
      draft: NewSkillDraft
    }) => {
      if (!user) throw new Error('You need to be signed in to edit a skill.')
      const tags = await queryClient.fetchQuery({
        queryKey: tagsQueryKey,
        queryFn: fetchTags,
        staleTime: Infinity,
      })
      return updateSkill(skillId, draft, tagIdResolver(tags))
    },
    onMutate: async ({ skillId, draft }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Skill[]>(key)
      queryClient.setQueryData<Skill[]>(key, (old) =>
        (old ?? []).map((s) =>
          s.id === skillId
            ? {
                ...s,
                title: draft.title.trim(),
                description: draft.description.trim(),
                tags: draft.tags,
              }
            : s,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
