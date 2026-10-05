// The UI's shared skill types. Field names follow the real `skills` table
// (migration 0001): `description` is a single text field — the card clamps it,
// the detail view shows it in full. (`is_favorite` still exists in the DB but
// is no longer surfaced; distress-set membership replaced it in the UI.)

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
  /** Seeded on signup (one of the starter set), vs. added by the user. */
  isDefault: boolean
  /** ISO timestamps from the row; drive My Anchors' latest-activity order. */
  createdAt: string
  updatedAt: string
  tags: Tag[]
}
