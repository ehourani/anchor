// The logging write path.
//
// Today there is no auth/session and skills are static sample data, so this just
// resolves locally — enough to make the flow feel complete. Once auth + live
// skills are in, this becomes an optimistic insert into `usage_logs`
// (skill_id, used_at, optional helpfulness + note) via supabase-js + TanStack
// Query. See migration 0001 for the column shape. This function is the single
// seam to swap when that lands.

// `helpfulness` is the 1-5 `usage_logs` column, but the user only ever sees
// gentle words — never a number or a score. The five labels map 1:1 to 1-5.
export type Helpfulness = 1 | 2 | 3 | 4 | 5

export const helpOptions: { label: string; value: Helpfulness }[] = [
  { label: 'Not at all', value: 1 },
  { label: 'A little', value: 2 },
  { label: 'Somewhat', value: 3 },
  { label: 'Mostly', value: 4 },
  { label: 'A lot', value: 5 },
]

export type UsageLogDraft = {
  skillId: string
  helpfulness: Helpfulness | null
  note: string
}

export async function logSkillUse(draft: UsageLogDraft): Promise<void> {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('logSkillUse (not yet persisted)', draft)
  }
}
