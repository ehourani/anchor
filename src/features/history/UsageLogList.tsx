import { helpOptions } from '@/features/logging/logging'
import type { UsageLog } from './useUsageLogs'

const helpLabel = (value: number | null) =>
  helpOptions.find((o) => o.value === value)?.label ?? null

// Gentle date — "Today" / "Yesterday" / "Mon, Jun 9", with the time. Never a
// streak or a count; just a quiet record of when.
function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (days === 0) return `Today, ${time}`
  if (days === 1) return `Yesterday, ${time}`
  const date = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  return `${date}, ${time}`
}

// Shared list for both the all-logs view and a single skill's history.
// `showSkill` adds the skill title to each row (omit it when the title is
// already the screen heading).
export function UsageLogList({
  logs,
  isLoading,
  isError,
  showSkill,
}: {
  logs: UsageLog[]
  isLoading: boolean
  isError: boolean
  showSkill: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center text-sm text-foreground/55 backdrop-blur-md">
        Gathering your reflections…
      </div>
    )
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center text-sm text-foreground/60 backdrop-blur-md">
        We couldn't load your reflections just now. Try again in a moment.
      </div>
    )
  }
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center text-sm text-foreground/60 backdrop-blur-md">
        No entries yet. Each time you use a skill, it'll gently show up here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const help = helpLabel(log.helpfulness)
        return (
          <div
            key={log.id}
            className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-md"
          >
            <div className="flex items-baseline justify-between gap-3">
              {showSkill ? (
                <p className="font-semibold text-foreground">{log.skillTitle}</p>
              ) : (
                <span />
              )}
              <p className="shrink-0 text-xs text-foreground/45">
                {formatWhen(log.usedAt)}
              </p>
            </div>
            {help && (
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Did it help? {help}
              </span>
            )}
            {log.note && (
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {log.note}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
