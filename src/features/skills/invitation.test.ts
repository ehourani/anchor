import { describe, expect, it } from 'vitest'

import { makeSkill, tag } from '@/test/fixtures'
import { hashSeed, pickInvitation } from './invitation'

describe('pickInvitation', () => {
  const low1 = makeSkill({ title: 'Low one', tags: [tag('effort', 'low')] })
  const low2 = makeSkill({ title: 'Low two', tags: [tag('effort', 'low')] })
  const high = makeSkill({ title: 'High', tags: [tag('effort', 'high')] })

  it('returns null for an empty toolkit', () => {
    expect(pickInvitation([], 'seed')).toBeNull()
  })

  it('is stable for the same seed (same pick all day)', () => {
    const skills = [low1, low2, high]
    const seed = 'user-1:Sun Oct 04 2026'
    expect(pickInvitation(skills, seed)).toBe(pickInvitation(skills, seed))
  })

  it('only picks low-effort skills when any exist', () => {
    for (let day = 0; day < 30; day++) {
      const pick = pickInvitation([low1, high, low2], `user-1:day-${day}`)
      expect([low1, low2]).toContain(pick)
    }
  })

  it('falls back to the whole toolkit when nothing is low effort', () => {
    expect(pickInvitation([high], 'any')).toBe(high)
  })
})

describe('hashSeed', () => {
  it('is deterministic and unsigned', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'))
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0)
  })
})
