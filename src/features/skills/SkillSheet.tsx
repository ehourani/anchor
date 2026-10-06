import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'

import type { Skill } from './sampleSkills'
import type { NewSkillDraft } from './skills'
import { SkillForm } from './SkillForm'

// One sheet for both adding and editing a skill. Pass `skill` to edit (the form
// pre-fills and the copy shifts to an edit voice); omit it to add. `onSubmit`
// receives the draft either way — the caller wires it to create vs. update.
export function SkillSheet({
  open,
  onClose,
  onSubmit,
  defaultSituation = null,
  skill = null,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (draft: NewSkillDraft) => Promise<void>
  defaultSituation?: string | null
  skill?: Skill | null
}) {
  const isEdit = skill !== null
  const [done, setDone] = useState<string | null>(null)
  // Bumped on each open so the form remounts fresh (pre-filled from the skill
  // when editing, else blank with the situation we came from). Keyed on the
  // skill id (not the object) so a background refetch can't reset it mid-edit.
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setDone(null)
    setFormKey((k) => k + 1)
  }, [open, skill?.id, defaultSituation])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const submit = async (draft: NewSkillDraft) => {
    await onSubmit(draft)
    // Only celebrate once the write actually landed.
    setDone(draft.title.trim())
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
        aria-label={isEdit ? 'Edit an anchor' : 'Add an Anchor'}
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {done !== null
                ? isEdit
                  ? 'Saved'
                  : 'Added to your toolkit'
                : isEdit
                  ? 'Edit anchor'
                  : 'Add an Anchor'}
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

        {done !== null ? (
          <div className="px-6 pb-8 pt-4">
            <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-primary">
              <Check className="size-5" />
              <span className="font-semibold">
                {isEdit
                  ? `“${done}” is updated.`
                  : `“${done}” is in your toolkit now.`}
              </span>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <SkillForm
            key={formKey}
            skill={skill}
            defaultSituation={defaultSituation}
            onSubmit={submit}
            submitLabel={isEdit ? 'Save changes' : 'Add anchor'}
            savingLabel={isEdit ? 'Saving…' : 'Adding…'}
          />
        )}
      </div>
    </>
  )
}
