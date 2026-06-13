import { useMemo } from 'react'

import { useUsageLogs, type UsageLog } from './useUsageLogs'

// Per-skill usage signals derived from the user's own logs: when they last used
// it, and how helpful it's been on average. Powers recency ordering in the log
// sheet and helpfulness ordering in the skill lists.
export type SkillUsageStat = {
  lastUsedAt: string | null
  // Mean of the rated uses (1-5), or null if none were reflected on.
  helpfulnessAvg: number | null
  count: number
}

function buildStats(logs: UsageLog[]): Map<string, SkillUsageStat> {
  // Accumulate sums first, then finalize to an average.
  const acc = new Map<
    string,
    { lastUsedAt: string; sum: number; rated: number; count: number }
  >()
  // Logs arrive newest-first, so the first time we see a skill is its last use.
  for (const log of logs) {
    const existing = acc.get(log.skillId)
    if (existing) {
      existing.count += 1
      if (log.helpfulness != null) {
        existing.sum += log.helpfulness
        existing.rated += 1
      }
    } else {
      acc.set(log.skillId, {
        lastUsedAt: log.usedAt,
        sum: log.helpfulness ?? 0,
        rated: log.helpfulness != null ? 1 : 0,
        count: 1,
      })
    }
  }

  const stats = new Map<string, SkillUsageStat>()
  for (const [skillId, a] of acc) {
    stats.set(skillId, {
      lastUsedAt: a.lastUsedAt,
      helpfulnessAvg: a.rated > 0 ? a.sum / a.rated : null,
      count: a.count,
    })
  }
  return stats
}

export function useSkillUsageStats(): Map<string, SkillUsageStat> {
  const { data: logs = [] } = useUsageLogs()
  return useMemo(() => buildStats(logs), [logs])
}
