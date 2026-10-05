import type { Skill } from './sampleSkills'

// How helpful a skill has been for this user (avg reflection rating), with
// unrated skills at a neutral midpoint so lists stay alphabetical until
// ratings exist.
export type HelpScore = (skillId: string) => number

// A situation's list: starred first; in distress the curated priority order
// leads; then what's worked best (by your reflections); then alphabetical.
export function compareSituationMatches(situationKey: string, helpScore: HelpScore) {
  return (a: Skill, b: Skill): number =>
    Number(b.isFavorite) - Number(a.isFavorite) ||
    (situationKey === 'crisis'
      ? (a.crisisPriority ?? 99) - (b.crisisPriority ?? 99)
      : 0) ||
    helpScore(b.id) - helpScore(a.id) ||
    a.title.localeCompare(b.title)
}

// The full toolkit: starred first, then most-helpful, then alphabetical.
export function compareToolkit(helpScore: HelpScore) {
  return (a: Skill, b: Skill): number =>
    Number(b.isFavorite) - Number(a.isFavorite) ||
    helpScore(b.id) - helpScore(a.id) ||
    a.title.localeCompare(b.title)
}
