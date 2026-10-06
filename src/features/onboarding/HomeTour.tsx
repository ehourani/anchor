import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// The one-time guided tour of the home screen, run right after onboarding.
// Coach marks, not a modal: nothing blocks the page, so In Distress and the
// support links stay one tap away (and leaving home simply ends the tour).
// Elements opt in as targets with a `data-tour` attribute.

export type TourStep = {
  title: string
  body: string
  // Where the card sits: next to the wheel, or just above the bottom nav.
  place: 'wheel' | 'nav'
  // A `data-tour` target to circle with a soft ring.
  ring?: string
  // A wheel segment to spotlight (the others fade back).
  focus?: string
  // The wheel should be open for this step.
  wheelOpen?: boolean
}

// Draft copy — the owner's call.
export const tourSteps: TourStep[] = [
  {
    title: 'A quick look around',
    body: "Tap the anchor whenever you need something. It opens into four kinds of anchors. You can skip this anytime.",
    place: 'wheel',
    ring: 'anchor',
  },
  {
    title: 'In distress',
    body: 'For the hardest moments. It takes you straight to your distress anchors, with support lines close by.',
    place: 'wheel',
    focus: 'crisis',
    wheelOpen: true,
  },
  {
    title: 'Calm down',
    body: 'For when feelings run high and you want to soften them.',
    place: 'wheel',
    focus: 'emotion-regulation',
    wheelOpen: true,
  },
  {
    title: 'Slow the spiral',
    body: 'For when your thoughts are racing. These anchors shift your focus for a bit.',
    place: 'wheel',
    focus: 'distraction',
    wheelOpen: true,
  },
  {
    title: 'Build balance',
    body: 'Small, steady things that build you up, often on calmer days.',
    place: 'wheel',
    focus: 'life-building',
    wheelOpen: true,
  },
  {
    title: 'Always one tap away',
    body: 'In Distress stays right here, wherever you are in Anchor, with your distress anchors and support lines.',
    place: 'nav',
    ring: 'nav-distress',
  },
  {
    title: 'Reflect when you like',
    body: 'After you use an anchor, tap Reflect to note it. Adding how it went is always optional.',
    place: 'nav',
    ring: 'nav-reflect',
  },
  {
    title: "You're ready",
    body: "Take your time. Anchor is here whenever you need it.",
    place: 'wheel',
  },
]

const GAP = 12 // between the card and what it points at
const EDGE = 8 // minimum breathing room from the viewport edges

type Layout = {
  top: number
  ring: { left: number; top: number; width: number; height: number } | null
}

const rectOf = (target: string) =>
  document.querySelector(`[data-tour="${target}"]`)?.getBoundingClientRect() ?? null

export function HomeTour({
  step,
  onNext,
  onSkip,
}: {
  step: number
  onNext: () => void
  onSkip: () => void
}) {
  const current = tourSteps[step]
  const isLast = step === tourSteps.length - 1
  const cardRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)

  // Place the card beside its target, measured from the live layout. Re-measure
  // once the screen's entrance animation has settled, and on resize.
  useLayoutEffect(() => {
    const measure = () => {
      const card = cardRef.current
      const nav = rectOf('nav')
      const wheel = rectOf('wheel')
      if (!card || !nav) return
      const h = card.offsetHeight
      let top: number
      if (current.place === 'wheel' && wheel) {
        // Under the wheel if it fits above the nav, otherwise over it.
        const below = wheel.bottom + GAP
        top = below + h <= nav.top - GAP ? below : wheel.top - GAP - h
      } else {
        top = nav.top - GAP - h
      }
      top = Math.max(EDGE, top)
      const r = current.ring ? rectOf(current.ring) : null
      const pad = 4
      setLayout({
        top,
        ring: r && {
          left: r.left - pad,
          top: r.top - pad,
          width: r.width + pad * 2,
          height: r.height + pad * 2,
        },
      })
    }
    measure()
    const settle = setTimeout(measure, 700)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(settle)
      window.removeEventListener('resize', measure)
    }
  }, [current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  return (
    <>
      {layout?.ring && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed z-[35] border-2 border-primary/70 shadow-[0_0_0_6px_hsl(195_70%_60%_/_0.18)] transition-all duration-300 motion-reduce:transition-none ${
            current.ring === 'anchor' ? 'rounded-full' : 'rounded-2xl'
          }`}
          style={layout.ring}
        />
      )}

      <div
        className="pointer-events-none fixed inset-x-0 z-[35] mx-auto max-w-md px-5"
        style={{ top: layout?.top ?? 0, visibility: layout ? 'visible' : 'hidden' }}
      >
        <div
          ref={cardRef}
          key={step}
          role="dialog"
          aria-modal="false"
          aria-labelledby="home-tour-title"
          className="animate-fade-rise pointer-events-auto rounded-2xl border border-white/70 bg-[hsl(196,54%,98%)]/95 p-4 shadow-[0_12px_32px_-12px_hsl(200_50%_40%_/_0.35)] backdrop-blur-md"
        >
          <p className="text-xs font-medium text-foreground/40">
            {step + 1} of {tourSteps.length}
          </p>
          <h2
            id="home-tour-title"
            className="mt-0.5 font-display text-base font-semibold text-foreground"
          >
            {current.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground/65">
            {current.body}
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            {!isLast && (
              <button
                onClick={onSkip}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                Skip tour
              </button>
            )}
            <button
              onClick={onNext}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
