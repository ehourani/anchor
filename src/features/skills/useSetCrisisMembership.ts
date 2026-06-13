import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/AuthProvider'
import type { Skill } from './sampleSkills'
import { setCrisisPriority } from './skills'
import { skillsQueryKey } from './useSkills'

// Adds or removes a skill from the crisis set, optimistically. Membership is a
// non-null crisis_priority; we append new members after the current highest
// rank, and clear the priority to remove. Mirrors useToggleFavorite.
export function useSetCrisisMembership() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const key = skillsQueryKey(user?.id)

  return useMutation({
    mutationFn: ({
      skillId,
      priority,
    }: {
      skillId: string
      priority: number | null
    }) => setCrisisPriority(skillId, priority),
    onMutate: async ({ skillId, priority }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<Skill[]>(key)
      queryClient.setQueryData<Skill[]>(key, (old) =>
        (old ?? []).map((s) =>
          s.id === skillId ? { ...s, crisisPriority: priority } : s,
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

// The next priority to assign when adding a skill: one past the current max
// (so additions land at the end of the ordered set).
export function nextCrisisPriority(skills: Skill[]): number {
  const max = skills.reduce(
    (m, s) => (s.crisisPriority != null && s.crisisPriority > m ? s.crisisPriority : m),
    0,
  )
  return max + 1
}
