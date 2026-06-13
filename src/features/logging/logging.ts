// Shared logging vocabulary. The write path itself lives in `useUsageLogger`.

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
