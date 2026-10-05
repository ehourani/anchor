import { describe, expect, it } from 'vitest'

import { makeSkill, tag } from '@/test/fixtures'
import { countFilters, emptyFilters, matchesFilters, toggleFilter } from './filters'

const breathing = makeSkill({
  tags: [
    tag('situation', 'crisis'),
    tag('situation', 'emotion-regulation'),
    tag('effort', 'low'),
    tag('setting', 'anywhere'),
  ],
})

describe('matchesFilters', () => {
  it('passes everything when no filters are set', () => {
    expect(matchesFilters(breathing, emptyFilters())).toBe(true)
    expect(matchesFilters(makeSkill(), emptyFilters())).toBe(true)
  })

  it('ORs tags within a category', () => {
    const filters = { ...emptyFilters(), situation: ['distraction', 'crisis'] }
    expect(matchesFilters(breathing, filters)).toBe(true)
  })

  it('ANDs across categories', () => {
    const lowAnywhere = { ...emptyFilters(), effort: ['low'], setting: ['anywhere'] }
    const lowOutdoors = { ...emptyFilters(), effort: ['low'], setting: ['outdoors'] }
    expect(matchesFilters(breathing, lowAnywhere)).toBe(true)
    expect(matchesFilters(breathing, lowOutdoors)).toBe(false)
  })

  it('does not confuse the same slug across categories', () => {
    const skill = makeSkill({ tags: [tag('setting', 'low')] })
    expect(matchesFilters(skill, { ...emptyFilters(), effort: ['low'] })).toBe(false)
  })
})

describe('toggleFilter / countFilters', () => {
  it('adds then removes a slug without touching other categories', () => {
    const on = toggleFilter(
      { ...emptyFilters(), setting: ['home'] },
      'effort',
      'low',
    )
    expect(on.effort).toEqual(['low'])
    expect(on.setting).toEqual(['home'])
    expect(countFilters(on)).toBe(2)

    const off = toggleFilter(on, 'effort', 'low')
    expect(off.effort).toEqual([])
    expect(countFilters(off)).toBe(1)
  })
})
