import { useEffect } from 'react'

// The one-time guided tour of the home screen, run right after onboarding.
// Coach marks, not a modal: nothing blocks the page, so In Distress and the
// support links stay one tap away (and leaving home simply ends the tour).
// The card takes the greeting's place at the top of home; what it describes is
// ringed or spotlit in place by the wheel and the nav themselves.

export type TourStep = {
  title: string
  body: string
  // What to circle with a soft ring: the whole buoy, or a nav item.
  ring?: 'wheel' | 'nav-anchors' | 'nav-distress' | 'nav-reflect'
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
    ring: 'wheel',
  },
  {
    title: 'In distress',
    body: 'For the hardest moments. It takes you straight to your distress anchors, with support lines close by.',
    focus: 'crisis',
    wheelOpen: true,
  },
  {
    title: 'Calm down',
    body: 'For when feelings run high and you want to soften them.',
    focus: 'emotion-regulation',
    wheelOpen: true,
  },
  {
    title: 'Slow the spiral',
    body: 'For when your thoughts are racing. These anchors shift your focus for a bit.',
    focus: 'distraction',
    wheelOpen: true,
  },
  {
    title: 'Build balance',
    body: 'Small, steady things that build you up, often on calmer days.',
    focus: 'life-building',
    wheelOpen: true,
  },
  {
    title: 'Always one tap away',
    body: 'In Distress stays right here, wherever you are in Anchor, with your distress anchors and support lines.',
    ring: 'nav-distress',
  },
  {
    title: 'Reflect when you like',
    body: 'After you use an anchor, tap Reflect to note it. Adding how it went is always optional.',
    ring: 'nav-reflect',
  },
  {
    title: 'All your anchors',
    body: 'My Anchors holds every anchor you have. Browse them, edit them, or add your own.',
    ring: 'nav-anchors',
  },
  {
    title: "You're ready",
    body: "Take your time. Anchor is here whenever you need it.",
  },
]

export function HomeTour({
  step,
  onNext,
  onSkip,
}: {
  step: number
  onNext: () => void
  onSkip: () => void
}) {
  const isLast = step === tourSteps.length - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-tour-title"
      className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_12px_32px_-12px_hsl(200_50%_40%_/_0.3)] backdrop-blur-md"
    >
      {/* Every step's text shares one grid cell, so the card is always as
          tall as the longest step and nothing below it shifts between steps.
          Only the current one is visible (and exposed to assistive tech). */}
      <div className="grid">
        {tourSteps.map((s, i) => (
          <div
            key={s.title}
            aria-hidden={i !== step}
            className={`col-start-1 row-start-1 transition-opacity duration-300 motion-reduce:transition-none ${
              i === step ? 'opacity-100' : 'invisible opacity-0'
            }`}
          >
            <p className="text-xs font-medium text-foreground/40">
              {i + 1} of {tourSteps.length}
            </p>
            <h2
              id={i === step ? 'home-tour-title' : undefined}
              className="mt-0.5 font-display text-base font-semibold text-foreground"
            >
              {s.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/65">
              {s.body}
            </p>
          </div>
        ))}
      </div>
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
  )
}
