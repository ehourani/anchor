import { useEffect, useState } from 'react'
import { Check, ChevronRight, X } from 'lucide-react'

import type { Skill } from '@/features/skills/sampleSkills'
import { type Helpfulness } from './logging'
import { useUsageLogger } from './useUsageLogger'
import { LogReflection } from './LogReflection'

// Quick "log a skill you used" sheet, opened from the notebook button. Pick a
// skill → it logs instantly → optional, skippable reflection.
export function LogSheet({
  open,
  onClose,
  skills,
}: {
  open: boolean
  onClose: () => void
  skills: Skill[]
}) {
  const [skillId, setSkillId] = useState<string | null>(null)
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null)
  const [note, setNote] = useState('')
  const { startLog, saveReflection: persistReflection } = useUsageLogger()

  // Fresh start each time the sheet opens.
  useEffect(() => {
    if (open) {
      setSkillId(null)
      setHelpfulness(null)
      setNote('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const selected = skills.find((s) => s.id === skillId) ?? null

  const pick = (id: string) => {
    setSkillId(id)
    startLog(id)
  }

  const saveReflection = (h: Helpfulness | null, n: string) => {
    setHelpfulness(h)
    setNote(n)
    if (skillId) persistReflection(h, n)
  }

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log a skill you used"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {selected ? selected.title : 'What did you use?'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-3">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
                <Check className="size-5" />
                <span className="font-semibold">Logged — gently done.</span>
              </div>
              <LogReflection
                helpfulness={helpfulness}
                note={note}
                onChange={saveReflection}
              />
              <button
                onClick={onClose}
                className="w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 text-left transition-colors hover:bg-white"
                >
                  <span className="font-semibold text-foreground">
                    {s.title}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-foreground/40" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
