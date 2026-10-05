import { describe, expect, it } from 'vitest'

import { makeSkill } from '@/test/fixtures'
import { compareSituationMatches, compareToolkit } from './sorting'

const neutral = () => 3
const titles = (skills: { title: string }[]) => skills.map((s) => s.title)

describe('compareToolkit', () => {
  it('falls back to alphabetical when nothing is rated or starred', () => {
    const skills = [
      makeSkill({ title: 'Walk' }),
      makeSkill({ title: 'Breathe' }),
      makeSkill({ title: 'Journal' }),
    ]
    expect(titles(skills.sort(compareToolkit(neutral)))).toEqual([
      'Breathe',
      'Journal',
      'Walk',
    ])
  })

  it('puts starred first, then the most helpful', () => {
    const a = makeSkill({ id: 'a', title: 'A' })
    const b = makeSkill({ id: 'b', title: 'B' })
    const c = makeSkill({ id: 'c', title: 'C', isFavorite: true })
    const help = (id: string) => ({ a: 2, b: 5, c: 1 })[id] ?? 3
    expect(titles([a, b, c].sort(compareToolkit(help)))).toEqual(['C', 'B', 'A'])
  })
})

describe('compareSituationMatches', () => {
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
