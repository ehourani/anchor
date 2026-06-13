import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import { usageLogsRootKey } from '@/features/history/useUsageLogs'
import type { Helpfulness } from './logging'

// Notes arrive a keystroke at a time, so coalesce reflection writes.
const REFLECTION_DEBOUNCE_MS = 500

// Manages one "use" at a time: the instant log inserts a usage_logs row and we
// hold its id; the optional reflection then UPDATEs that same row (one row per
// use, never a second insert). Logging stays fire-and-forget so it feels
// instant; failures are logged to the console rather than blocking the UI.
export function useUsageLogger() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // The in-flight insert, resolving to the new row id. A ref (not state) so
  // reflection writes can await it without re-rendering.
  const logIdRef = useRef<Promise<string> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startLog = useCallback(
    (skillId: string) => {
      if (!user) return
      if (timerRef.current) clearTimeout(timerRef.current)
      const pending = (async () => {
        const { data, error } = await supabase
          .from('usage_logs')
          .insert({ user_id: user.id, skill_id: skillId })
          .select('id')
          .single()
        if (error) throw error
        return data.id
      })()
      logIdRef.current = pending
      pending
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: usageLogsRootKey(user.id),
          }),
        )
        .catch((e) => console.error('Failed to log use:', e))
    },
    [user, queryClient],
  )

  const saveReflection = useCallback(
    (helpfulness: Helpfulness | null, note: string) => {
      // Bind to the log that's current *now*, so a late-firing write can't land
      // on a different row if another log starts in the meantime.
      const target = logIdRef.current
      if (!target) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        try {
          const id = await target
          const { error } = await supabase
            .from('usage_logs')
            .update({ helpfulness, note: note.trim() || null })
            .eq('id', id)
          if (error) throw error
          if (user) {
            queryClient.invalidateQueries({
              queryKey: usageLogsRootKey(user.id),
            })
          }
        } catch (e) {
          console.error('Failed to save reflection:', e)
        }
      }, REFLECTION_DEBOUNCE_MS)
    },
    [user, queryClient],
  )

  return { startLog, saveReflection }
}
