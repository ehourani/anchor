// Static sample data for the look-and-feel mockup. Mirrors the seeded taxonomy
// (see migration 0003) and the 6 default starter skills (0005). No live data yet —
// this exists only so we can react to the visual design before wiring up Supabase.
// Field names follow the real `skills` table (migration 0001): `description` is a
// single text field — the card clamps it, the detail view shows it in full.

export type TagCategory =
  | 'situation'
  | 'effort'
  | 'setting'
  | 'senses'
  | 'modality'

export type Tag = {
  category: TagCategory
  label: string
}

export type Skill = {
  id: string
  title: string
  description: string
  /** 1 = highest. Present means it's part of the out-of-the-box crisis set. */
  crisisPriority: number | null
  isFavorite: boolean
  tags: Tag[]
}

export const sampleSkills: Skill[] = [
  {
    id: 'reach-out',
    title: 'Reach out to someone safe',
    description:
      "Send one small message to a person who feels steady right now — a friend, a family member, anyone safe. You don't need the right words. Even “thinking of you” or “having a hard moment” is enough to feel a little less alone.",
    crisisPriority: 1,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'crisis' },
      { category: 'situation', label: 'emotion-regulation' },
      { category: 'effort', label: 'low' },
      { category: 'setting', label: 'anywhere' },
    ],
  },
  {
    id: 'cold-water',
    title: 'Cold water reset',
    description:
      'Splash cold water on your face, hold an ice cube, or press something cold to your wrists or the back of your neck for about 30 seconds. The cold gently shifts your body out of a spike of distress and back toward calm.',
    crisisPriority: 2,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'crisis' },
      { category: 'situation', label: 'distraction' },
      { category: 'effort', label: 'low' },
      { category: 'setting', label: 'home' },
      { category: 'senses', label: 'touch' },
    ],
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 grounding',
    description:
      'Slowly notice five things you can see, four you can hear, three you can touch, two you can smell, and one you can taste. Take your time with each one — it brings you out of your head and back into the present moment.',
    crisisPriority: 3,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'crisis' },
      { category: 'situation', label: 'emotion-regulation' },
      { category: 'effort', label: 'low' },
      { category: 'setting', label: 'anywhere' },
      { category: 'senses', label: 'sight' },
      { category: 'senses', label: 'sound' },
    ],
  },
  {
    id: 'breathing',
    title: 'Slow paced breathing',
    description:
      'Breathe in gently for a count of four, then out for a count of six. Let the out-breath be longer and softer than the in-breath, and repeat for a minute or two. The longer exhale is what settles your nervous system.',
    crisisPriority: 4,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'crisis' },
      { category: 'situation', label: 'emotion-regulation' },
      { category: 'effort', label: 'low' },
      { category: 'setting', label: 'anywhere' },
    ],
  },
  {
    id: 'ride-urge',
    title: 'Ride out the urge',
    description:
      "Notice the urge like a wave in the ocean — it rises, it crests, and it always passes. You don't have to act on it or push it away. Just breathe and watch it move through, knowing it will ease on its own.",
    crisisPriority: 5,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'crisis' },
      { category: 'situation', label: 'distraction' },
      { category: 'effort', label: 'medium' },
      { category: 'setting', label: 'anywhere' },
      { category: 'modality', label: 'DBT' },
    ],
  },
  {
    id: 'walk',
    title: 'Step outside for a short walk',
    description:
      'Step outside for a few minutes of fresh air and a change of scene — around the block, to the end of the street, or just out the door. No destination, no pace to keep. The movement and the shift in surroundings can loosen a stuck feeling.',
    crisisPriority: null,
    isFavorite: false,
    tags: [
      { category: 'situation', label: 'distraction' },
      { category: 'situation', label: 'life-building' },
      { category: 'effort', label: 'medium' },
      { category: 'setting', label: 'outdoors' },
      { category: 'senses', label: 'movement' },
    ],
  },
]
