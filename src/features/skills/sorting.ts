import type { Skill } from './sampleSkills'

// How helpful a skill has been for this user (avg reflection rating), with
// unrated skills at a neutral midpoint so lists stay alphabetical until
// ratings exist.
export type HelpScore = (skillId: string) => number

// When the user last logged a use of a skill (ISO), if ever.
export type LastUsed = (skillId: string) => string | null

// A situation's list: in distress the curated priority order leads; then
// what's worked best (by your reflections); then alphabetical.
export function compareSituationMatches(situationKey: string, helpScore: HelpScore) {
  return (a: Skill, b: Skill): number =>
    (situationKey === 'crisis'
      ? (a.crisisPriority ?? 99) - (b.crisisPriority ?? 99)
      : 0) ||
    helpScore(b.id) - helpScore(a.id) ||
    a.title.localeCompare(b.title)
}

// A skill's most recent activity: the latest of its last use, creation, and
// last edit. Timestamps are used as-is (see ANC-54 for known quirks, e.g.
// reordering the distress set bumps updated_at).
export function latestActivity(skill: Skill, lastUsed: LastUsed): number {
  const used = lastUsed(skill.id)
  return Math.max(
    Date.parse(skill.createdAt) || 0,
    Date.parse(skill.updatedAt) || 0,
    used ? Date.parse(used) || 0 : 0,
  )
}

// My Anchors: most recently touched first, so new and just-used anchors land
// on top; ties broken by title.
export function compareByLatestActivity(lastUsed: LastUsed) {
  return (a: Skill, b: Skill): number =>
    latestActivity(b, lastUsed) - latestActivity(a, lastUsed) ||
    a.title.localeCompare(b.title)
}
