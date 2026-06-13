import { useEffect } from 'react'
import { List, NotebookPen, Plus, ScrollText, X } from 'lucide-react'

// The left navigation drawer, opened from the ☰ button. Quick actions up top,
// then a separator, then the "see everything" views.
export function MenuDrawer({
  open,
  onClose,
  onAddSkill,
  onLogUsage,
  onAllSkills,
  onAllLogs,
}: {
  open: boolean
  onClose: () => void
  onAddSkill: () => void
  onLogUsage: () => void
  onAllSkills: () => void
  onAllLogs: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const item =
    'flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[0.95rem] font-medium text-foreground/80 transition-colors hover:bg-white/70 hover:text-foreground'

  // Each action closes the drawer first, then runs.
  const run = (fn: () => void) => () => {
    onClose()
    fn()
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
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-white/60 bg-[hsl(196,54%,98%)] p-4 shadow-[12px_0_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
          <span className="font-display text-lg font-semibold text-foreground">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-1 flex flex-col gap-1">
          <button className={item} onClick={run(onAddSkill)}>
            <Plus className="size-5 text-foreground/55" />
            Add a skill
          </button>
          <button className={item} onClick={run(onLogUsage)}>
            <NotebookPen className="size-5 text-foreground/55" />
            Log a skill usage
          </button>

          <div className="my-2 h-px bg-foreground/10" />

          <button className={item} onClick={run(onAllSkills)}>
            <List className="size-5 text-foreground/55" />
            All skills
          </button>
          <button className={item} onClick={run(onAllLogs)}>
            <ScrollText className="size-5 text-foreground/55" />
            All skill usage logs
          </button>
        </nav>
      </div>
    </>
  )
}
