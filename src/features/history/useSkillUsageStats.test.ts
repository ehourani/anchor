import { describe, expect, it } from 'vitest'

import { buildStats } from './useSkillUsageStats'
import type { UsageLog } from './useUsageLogs'

function log(
  skillId: string,
  usedAt: string,
  helpfulness: UsageLog['helpfulness'] = null,
): UsageLog {
  return { id: `${skillId}-${usedAt}`, usedAt, helpfulness, note: null, skillId, skillTitle: skillId }
}

describe('buildStats', () => {
  it('is empty with no logs', () => {
    expect(buildStats([]).size).toBe(0)
  })

  // Logs arrive newest-first, so the first one seen is the last use.
  it('takes the first (newest) log as the last use and counts every use', () => {
    const stats = buildStats([
      log('a', '2026-10-03T10:00:00Z'),
      log('b', '2026-10-02T10:00:00Z'),
      log('a', '2026-10-01T10:00:00Z'),
    ])
    expect(stats.get('a')).toMatchObject({ lastUsedAt: '2026-10-03T10:00:00Z', count: 2 })
    expect(stats.get('b')).toMatchObject({ lastUsedAt: '2026-10-02T10:00:00Z', count: 1 })
  })

  it('averages only the rated uses', () => {
    const stats = buildStats([
      log('a', '2026-10-03T10:00:00Z', 5),
      log('a', '2026-10-02T10:00:00Z', null),
      log('a', '2026-10-01T10:00:00Z', 2),
    ])
    expect(stats.get('a')?.helpfulnessAvg).toBe(3.5)
  })

  it('leaves helpfulness null when nothing was rated', () => {
    const stats = buildStats([log('a', '2026-10-03T10:00:00Z')])
    expect(stats.get('a')?.helpfulnessAvg).toBeNull()
  })
})
