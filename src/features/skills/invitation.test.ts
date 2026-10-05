import { describe, expect, it } from 'vitest'

import { makeSkill, tag } from '@/test/fixtures'
import { hashSeed, pickTodaysSkill } from './invitation'

describe("pickTodaysSkill (Today's Skill)", () => {
  const balance1 = makeSkill({ title: 'Balance one', tags: [tag('situation', 'life-building')] })
  const balance2 = makeSkill({ title: 'Balance two', tags: [tag('situation', 'life-building')] })
  const calm = makeSkill({ title: 'Calm', tags: [tag('situation', 'emotion-regulation'), tag('effort', 'low')] })
  const distress = makeSkill({ title: 'Distress', tags: [tag('situation', 'crisis')] })

  it('returns null with no Build balance anchors, so the card hides', () => {
    expect(pickTodaysSkill([], 'seed')).toBeNull()
    expect(pickTodaysSkill([calm, distress], 'seed')).toBeNull()
  })

  it('only ever picks Build balance anchors', () => {
    for (let day = 0; day < 30; day++) {
      const pick = pickTodaysSkill([calm, balance1, distress, balance2], `user-1:day-${day}`)
      expect([balance1, balance2]).toContain(pick)
    }
  })

  it('is stable for the same seed (same pick all day)', () => {
    const skills = [balance1, balance2, calm]
    const seed = 'user-1:Sun Oct 04 2026'
    expect(pickTodaysSkill(skills, seed)).toBe(pickTodaysSkill(skills, seed))
  })

  it('rotates across days', () => {
    const picks = new Set(
      Array.from({ length: 30 }, (_, day) => pickTodaysSkill([balance1, balance2], `user-1:day-${day}`)),
    )
    expect(picks.size).toBe(2)
  })
})

describe('hashSeed', () => {
  it('is deterministic and unsigned', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'))
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0)
  })
})
