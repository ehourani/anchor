import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill } from './sampleSkills'
import { setFavorite } from './skills'
import { skillsQueryKey } from './useSkills'

// Toggles a skill's favorite flag. Optimistic so the star fills instantly,
// reconciled by invalidating on settle. Mirrors useCreateSkill's pattern.
export function useToggleFavorite() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = skillsQueryKey(user?.id)

  return useMutation({
    mutationFn: ({
      skillId,
      isFavorite,
    }: {
      skillId: string
      isFavorite: boolean
    }) => setFavorite(skillId, isFavorite),
    onMutate: async ({ skillId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Skill[]>(key)
      queryClient.setQueryData<Skill[]>(key, (old) =>
        (old ?? []).map((s) =>
          s.id === skillId ? { ...s, isFavorite } : s,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      // Put the star back if the write failed.
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
