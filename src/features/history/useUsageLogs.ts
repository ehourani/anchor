import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Helpfulness } from '@/features/logging/logging'

// Root key for a user's usage history. The logger invalidates this prefix after
// a write, which (by TanStack's prefix matching) refreshes both the all-logs
// list and any per-skill list.
export function usageLogsRootKey(userId: string | undefined) {
  return ['usage_logs', userId] as const
}

export function usageLogsKey(userId: string | undefined, skillId?: string) {
  return [...usageLogsRootKey(userId), skillId ?? 'all'] as const
}

export type UsageLog = {
  id: string
  usedAt: string
  helpfulness: Helpfulness | null
  note: string | null
  skillId: string
  skillTitle: string
}

type Row = {
  id: string
  used_at: string
  helpfulness: number | null
  note: string | null
  skill_id: string
  skills: { title: string } | { title: string }[] | null
}

function toLog(r: Row): UsageLog {
  const skill = Array.isArray(r.skills) ? r.skills[0] : r.skills
  return {
    id: r.id,
    usedAt: r.used_at,
    helpfulness: (r.helpfulness as Helpfulness | null) ?? null,
    note: r.note,
    skillId: r.skill_id,
    skillTitle: skill?.title ?? 'A skill',
  }
}

// Usage logs for the signed-in user, newest first. Pass a skillId to scope to a
// single skill. RLS scopes rows to auth.uid(); the embedded skill title comes
// from the user's own skills.
export function useUsageLogs(skillId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: usageLogsKey(user?.id, skillId),
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('usage_logs')
        .select('id, used_at, helpfulness, note, skill_id, skills(title)')
        .order('used_at', { ascending: false })
      if (skillId) query = query.eq('skill_id', skillId)
      const { data, error } = await query
      if (error) throw error
      return (data as unknown as Row[]).map(toLog)
    },
  })
}
