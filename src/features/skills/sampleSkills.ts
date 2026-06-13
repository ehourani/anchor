// Static sample data for the look-and-feel mockup. Mirrors the seeded taxonomy
// (see migration 0003) and the 6 default starter skills (0005). No live data yet —
// this exists only so we can react to the visual design before wiring up Supabase.

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
  blurb: string
  /** 1 = highest. Present means it's part of the out-of-the-box crisis set. */
  crisisPriority: number | null
  tags: Tag[]
}

export const sampleSkills: Skill[] = [
  {
    id: 'reach-out',
    title: 'Reach out to someone safe',
    blurb: 'Send one small message to a person who feels steady right now.',
    crisisPriority: 1,
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
    blurb: 'Splash cold water on your face, or hold something cold for a moment.',
    crisisPriority: 2,
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
    blurb: 'Name five things you see, four you hear, three you can touch…',
    crisisPriority: 3,
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
    blurb: 'Breathe in for four, out for six. Let the out-breath be longer.',
    crisisPriority: 4,
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
    blurb: 'Notice the urge like a wave. It rises, it crests, it passes.',
    crisisPriority: 5,
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
    blurb: 'A few minutes of fresh air and a change of scene, no destination.',
    crisisPriority: null,
    tags: [
      { category: 'situation', label: 'distraction' },
      { category: 'situation', label: 'life-building' },
      { category: 'effort', label: 'medium' },
      { category: 'setting', label: 'outdoors' },
      { category: 'senses', label: 'movement' },
    ],
  },
]
