import { useEffect } from 'react'
import { X } from 'lucide-react'

// A gentle bottom drawer holding crisis-support contacts. Kept reachable from a
// quiet "?" button rather than weighing down the home screen — but always one
// tap away. ED-specific (Alliance for Eating Disorders) + general (988).
export function SupportDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="If you need to talk to someone"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] p-6 pb-9 shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-foreground/15" />

        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            If you need to talk to someone
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-1.5 text-sm text-foreground/60">
          You don't have to hold this alone — reaching out is its own kind of
          coping skill.
        </p>

        <div className="mt-5 space-y-3">
          <a
            href="https://www.allianceforeatingdisorders.com/find-help/"
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-white/70 bg-white/70 p-4 transition-colors hover:bg-white"
          >
            <p className="font-semibold text-foreground">
              National Alliance for Eating Disorders
            </p>
            <p className="mt-0.5 text-sm text-foreground/60">
              Eating-disorder helpline · 1-866-662-1235
            </p>
          </a>
          <a
            href="tel:988"
            className="block rounded-2xl border border-white/70 bg-white/70 p-4 transition-colors hover:bg-white"
          >
            <p className="font-semibold text-foreground">
              988 Suicide &amp; Crisis Lifeline
            </p>
            <p className="mt-0.5 text-sm text-foreground/60">
              Call or text 988 · 24/7, US
            </p>
          </a>
        </div>
      </div>
    </>
  )
}
