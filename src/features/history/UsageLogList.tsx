import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2 } from 'lucide-react'

import { helpOptions, type Helpfulness } from '@/features/logging/logging'
import { LogReflection } from '@/features/logging/LogReflection'
import type { UsageLog } from './useUsageLogs'
import { useDeleteLog, useUpdateLog } from './useLogMutations'

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

// One reflection, in edit mode — reuses the same gentle reflection control as
// logging. Save persists; Cancel discards. Local state so typing stays smooth.
function EditRow({
  log,
  onClose,
}: {
  log: UsageLog
  onClose: () => void
}) {
  const updateLog = useUpdateLog()
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(
    log.helpfulness,
  )
  const [note, setNote] = useState(log.note ?? '')

  const save = () => {
    updateLog.mutate({ id: log.id, helpfulness, note })
    onClose()
  }

  return (
    <div className="space-y-2.5">
      <LogReflection
        helpfulness={helpfulness}
        note={note}
        onChange={(h, n) => {
          setHelpfulness(h)
          setNote(n)
        }}
        hideIntro
      />
      <div className="flex gap-2.5">
        <button
          onClick={save}
          className="flex-1 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Save reflection
        </button>
        <button
          onClick={onClose}
          className="rounded-2xl border border-white/70 bg-white/70 px-5 py-3 font-semibold text-foreground/75 transition-colors hover:bg-white hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// Shared list for both the all-logs view and a single skill's history.
// `showSkill` adds the skill title to each row (omit it when the title is
// already the screen heading). Each entry can be gently edited or removed.
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
  const deleteLog = useDeleteLog()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<UsageLog | null>(null)

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
        if (editingId === log.id) {
          return (
            <EditRow
              key={log.id}
              log={log}
              onClose={() => setEditingId(null)}
            />
          )
        }
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
            <div className="mt-3 flex items-center gap-1 border-t border-foreground/5 pt-2.5">
              <button
                onClick={() => setEditingId(log.id)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-foreground/45 transition-colors hover:bg-white/60 hover:text-foreground"
              >
                <Pencil className="size-3.5" />
                {help || log.note ? 'Edit reflection' : 'Add a reflection'}
              </button>
              <button
                onClick={() => setDeleting(log)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-foreground/45 transition-colors hover:bg-white/60 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>
          </div>
        )
      })}

      {deleting &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm"
              onClick={() => setDeleting(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Remove this reflection"
              className="animate-fade-rise fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] p-6 shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)]"
            >
              <h2 className="font-display text-lg font-semibold text-foreground">
                Remove this entry?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
                This single reflection will be taken out of your history. Your
                skill stays in your toolkit. This can't be undone.
              </p>
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => {
                    deleteLog.mutate(deleting.id)
                    setDeleting(null)
                  }}
                  className="w-full rounded-2xl bg-destructive py-3.5 font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                >
                  Remove entry
                </button>
                <button
                  onClick={() => setDeleting(null)}
                  className="w-full rounded-2xl border border-white/70 bg-white/70 py-3 font-semibold text-foreground/75 transition-colors hover:bg-white hover:text-foreground"
                >
                  Keep it
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
