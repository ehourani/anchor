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

// Today's Skill: one Build balance (`life-building`) anchor to practice
// proactively — something for a steady day, not a hard moment. One pick per
// day, tied to the user (the same person sees the same skill all day, a
// different one tomorrow). Null when they have no Build balance anchors, so the
// card simply doesn't show.
export function pickTodaysSkill(skills: Skill[], seed: string): Skill | null {
  const pool = skills.filter((s) =>
    s.tags.some((t) => t.category === 'situation' && t.label === 'life-building'),
  )
  if (pool.length === 0) return null
  return pool[hashSeed(seed) % pool.length]
}
