import { describe, expect, it } from 'vitest'

import { makeSkill } from '@/test/fixtures'
import { compareByLatestActivity, compareSituationMatches } from './sorting'

const neutral = () => 3
const never = () => null
const titles = (skills: { title: string }[]) => skills.map((s) => s.title)

describe('compareSituationMatches', () => {
  it('falls back to alphabetical when nothing is rated', () => {
    const skills = [
      makeSkill({ title: 'Walk' }),
      makeSkill({ title: 'Breathe' }),
      makeSkill({ title: 'Journal' }),
    ]
    expect(titles(skills.sort(compareSituationMatches('distraction', neutral)))).toEqual([
      'Breathe',
      'Journal',
      'Walk',
    ])
  })

  it('puts the most helpful first', () => {
    const a = makeSkill({ id: 'a', title: 'A' })
    const b = makeSkill({ id: 'b', title: 'B' })
    const help = (id: string) => ({ a: 2, b: 5 })[id] ?? 3
    expect(titles([a, b].sort(compareSituationMatches('distraction', help)))).toEqual(['B', 'A'])
  })

  it('orders distress by the curated priority, ahead of helpfulness', () => {
    const first = makeSkill({ id: 'first', title: 'Z first', crisisPriority: 1 })
    const second = makeSkill({ id: 'second', title: 'A second', crisisPriority: 2 })
    const unranked = makeSkill({ id: 'unranked', title: 'M unranked' })
    const help = (id: string) => (id === 'unranked' ? 5 : 1)
    expect(
      titles([unranked, second, first].sort(compareSituationMatches('crisis', help))),
    ).toEqual(['Z first', 'A second', 'M unranked'])
  })

  it('ignores distress priority in other situations', () => {
    const ranked = makeSkill({ id: 'r', title: 'B ranked', crisisPriority: 1 })
    const other = makeSkill({ id: 'o', title: 'A other' })
    expect(
      titles([ranked, other].sort(compareSituationMatches('distraction', neutral))),
    ).toEqual(['A other', 'B ranked'])
  })
})

describe('compareByLatestActivity (My Anchors)', () => {
  const old = makeSkill({
    id: 'old',
    title: 'Old',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })
  const added = makeSkill({
    id: 'added',
    title: 'Just added',
    createdAt: '2026-10-04T12:00:00Z',
    updatedAt: '2026-10-04T12:00:00Z',
  })
  const edited = makeSkill({
    id: 'edited',
    title: 'Edited',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-10-03T00:00:00Z',
  })

  it('puts a newly added anchor first, then by latest edit', () => {
    expect(titles([old, edited, added].sort(compareByLatestActivity(never)))).toEqual([
      'Just added',
      'Edited',
      'Old',
    ])
  })

  it('moves an anchor to the top when it is used', () => {
    const lastUsed = (id: string) => (id === 'old' ? '2026-10-05T08:00:00Z' : null)
    expect(titles([added, edited, old].sort(compareByLatestActivity(lastUsed)))).toEqual([
      'Old',
      'Just added',
      'Edited',
    ])
  })

  it('breaks ties by title', () => {
    const at = '2026-05-01T00:00:00Z'
    const b = makeSkill({ title: 'B', createdAt: at, updatedAt: at })
    const a = makeSkill({ title: 'A', createdAt: at, updatedAt: at })
    expect(titles([b, a].sort(compareByLatestActivity(never)))).toEqual(['A', 'B'])
  })
})
