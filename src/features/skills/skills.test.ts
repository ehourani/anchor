import { describe, expect, it } from 'vitest'

import { makeSkill } from '@/test/fixtures'
import { diffTagIds } from './skills'
import { nextCrisisPriority } from './useSetCrisisMembership'

describe('diffTagIds (tag reconciliation on edit)', () => {
  it('adds new tags and removes dropped ones, leaving shared ones alone', () => {
    expect(diffTagIds(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual({
      toAdd: ['d'],
      toRemove: ['a'],
    })
  })

  it('is a no-op when nothing changed (order does not matter)', () => {
    expect(diffTagIds(['a', 'b'], ['b', 'a'])).toEqual({ toAdd: [], toRemove: [] })
  })

  it('handles empty sides', () => {
    expect(diffTagIds([], ['a'])).toEqual({ toAdd: ['a'], toRemove: [] })
    expect(diffTagIds(['a'], [])).toEqual({ toAdd: [], toRemove: ['a'] })
  })

  it('never asks to insert the same link twice', () => {
    expect(diffTagIds([], ['a', 'a']).toAdd).toEqual(['a'])
  })
})

describe('nextCrisisPriority', () => {
  it('starts at 1 for an empty distress set', () => {
    expect(nextCrisisPriority([makeSkill(), makeSkill()])).toBe(1)
  })

  it('appends after the highest existing priority, even with gaps', () => {
    expect(
      nextCrisisPriority([
        makeSkill({ crisisPriority: 1 }),
        makeSkill({ crisisPriority: 4 }),
        makeSkill({ crisisPriority: null }),
      ]),
    ).toBe(5)
  })
})
