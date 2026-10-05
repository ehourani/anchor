import type { Skill } from './sampleSkills'

// A small, stable string hash (FNV-1a) — turns a seed into a number we can use
// to pick a skill deterministically.
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// A softly-suggested skill to try today. Rotates gently: one pick per day, tied
// to the user (the same person sees the same invitation all day, a different one
// tomorrow). Prefers low-effort skills so the suggestion always feels doable,
// and falls back to the whole toolkit if none are tagged low.
export function pickInvitation(skills: Skill[], seed: string): Skill | null {
  if (skills.length === 0) return null
  const lowEffort = skills.filter((s) =>
    s.tags.some((t) => t.category === 'effort' && t.label === 'low'),
  )
  const pool = lowEffort.length > 0 ? lowEffort : skills
  return pool[hashSeed(seed) % pool.length]
}
