import { useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Helpfulness } from '@/features/logging/logging'
import { usageLogsRootKey, type UsageLog } from './useUsageLogs'

// Edit a reflection: update its helpfulness + note (never the timestamp — that's
// the honest record of when). RLS scopes the write to the owner.
async function updateLog(
  id: string,
  helpfulness: Helpfulness | null,
  note: string,
): Promise<void> {
  const { error } = await supabase
    .from('usage_logs')
    .update({ helpfulness, note: note.trim() || null })
    .eq('id', id)
  if (error) throw error
}

// Delete a single reflection. RLS scopes the delete to the owner.
async function deleteLog(id: string): Promise<void> {
  const { error } = await supabase.from('usage_logs').delete().eq('id', id)
  if (error) throw error
}

// Patches every cached log list (the all-logs list and any per-skill list, which
// share the root key prefix) so edits/deletes show up instantly everywhere.
function patchAllLists(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  updater: (logs: UsageLog[]) => UsageLog[],
) {
  queryClient.setQueriesData<UsageLog[]>(
    { queryKey: usageLogsRootKey(userId) },
    (old) => (old ? updater(old) : old),
  )
}

// Edit an existing reflection, optimistically. Mirrors the skills mutation
// pattern: patch the cache, roll back on error, invalidate on settle.
export function useUpdateLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const rootKey = usageLogsRootKey(user?.id)

  return useMutation({
    mutationFn: ({
      id,
      helpfulness,
      note,
    }: {
      id: string
      helpfulness: Helpfulness | null
      note: string
    }) => updateLog(id, helpfulness, note),
    onMutate: async ({ id, helpfulness, note }) => {
      await queryClient.cancelQueries({ queryKey: rootKey })
      const prev = queryClient.getQueriesData<UsageLog[]>({ queryKey: rootKey })
      patchAllLists(queryClient, user?.id, (logs) =>
        logs.map((l) =>
          l.id === id ? { ...l, helpfulness, note: note.trim() || null } : l,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rootKey })
    },
  })
}

// Delete a single reflection, optimistically.
export function useDeleteLog() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const rootKey = usageLogsRootKey(user?.id)

  return useMutation({
    mutationFn: (id: string) => deleteLog(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: rootKey })
      const prev = queryClient.getQueriesData<UsageLog[]>({ queryKey: rootKey })
      patchAllLists(queryClient, user?.id, (logs) =>
        logs.filter((l) => l.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rootKey })
    },
  })
}
