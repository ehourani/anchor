// The one-time guided tour of the home screen, run right after onboarding.
// While it runs, home's other controls are held still so it can't be left by
// accident; only In Distress stays live (it pauses the tour, never gates it).
// The card takes the greeting's place at the top of home; what it describes is
// ringed or spotlit in place by the wheel and the nav themselves.

export type TourStep = {
  title: string
  // Optional: a title-only step (the intro) centers in the card instead.
  body?: string
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
    title: "Let's show you around",
  },
  {
    title: 'Start here',
    body: 'Tap the anchor when you need something.',
    ring: 'wheel',
  },
  {
    title: 'In distress',
    body: 'For the hardest moments.',
    focus: 'crisis',
    wheelOpen: true,
  },
  {
    title: 'Calm down',
    body: 'For when feelings run high.',
    focus: 'emotion-regulation',
    wheelOpen: true,
  },
  {
    title: 'Slow the spiral',
    body: 'For when your thoughts are racing.',
    focus: 'distraction',
    wheelOpen: true,
  },
  {
    title: 'Build balance',
    body: 'Small, steady things that build you up.',
    focus: 'life-building',
    wheelOpen: true,
  },
  {
    title: 'Always one tap away',
    body: 'Your distress anchors and support lines.',
    ring: 'nav-distress',
  },
  {
    title: 'Reflect when you like',
    body: 'Note what you used. Always optional.',
    ring: 'nav-reflect',
  },
  {
    title: 'All your anchors',
    body: 'Browse, edit, or add your own.',
    ring: 'nav-anchors',
  },
  {
    title: "You're ready",
    body: 'Anchor is here whenever you need it.',
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

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-tour-title"
      className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-[0_12px_32px_-12px_hsl(200_50%_40%_/_0.3)] backdrop-blur-md"
    >
      {/* Every step's text shares one grid cell, so the card is always as
          tall as the longest step and nothing below it shifts between steps.
          Only the current one is visible (and exposed to assistive tech). */}
      <div className="grid">
        {tourSteps.map((s, i) => (
          <div
            key={s.title}
            aria-hidden={i !== step}
            className={`col-start-1 row-start-1 ${s.body ? '' : 'self-center'} transition-opacity duration-300 motion-reduce:transition-none ${
              i === step ? 'opacity-100' : 'invisible opacity-0'
            }`}
          >
            <h2
              id={i === step ? 'home-tour-title' : undefined}
              className="font-display text-base font-semibold text-foreground"
            >
              {s.title}
            </h2>
            {s.body && (
              <p className="mt-0.5 text-sm leading-snug text-foreground/65">
                {s.body}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5">
        {!isLast && (
          <button
            onClick={onSkip}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-foreground/55 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Skip tour
          </button>
        )}
        <button
          onClick={onNext}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  )
}
