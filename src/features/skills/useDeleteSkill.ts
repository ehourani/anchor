import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill } from './sampleSkills'
import { deleteSkill } from './skills'
import { skillsQueryKey } from './useSkills'

// Removes a skill: optimistically drops it from the cache so it disappears
// instantly, then reconciles on settle. Its usage logs cascade-delete in the
// DB, so the history views are refreshed too.
export function useDeleteSkill() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = skillsQueryKey(user?.id)

  return useMutation({
    mutationFn: (skillId: string) => deleteSkill(skillId),
    onMutate: async (skillId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Skill[]>(key)
      queryClient.setQueryData<Skill[]>(key, (old) =>
        (old ?? []).filter((s) => s.id !== skillId),
      )
      return { prev }
    },
    onError: (_err, _skillId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
      // Cascade-deleted usage logs: refresh every history view (root prefix).
      queryClient.invalidateQueries({ queryKey: ['usage_logs', user?.id] })
    },
  })
}
