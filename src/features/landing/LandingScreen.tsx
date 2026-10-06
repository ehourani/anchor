import { Anchor, Compass, LifeBuoy, Lock } from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { SupportLinks } from '@/features/crisis/SupportLinks'

// The public front door at anchortoolkit.com for anyone signed out: what Anchor
// is, how it treats your data, and the way in. It doubles as the homepage that
// Google's OAuth brand verification reviews, so it must stay public, describe
// the app, and link the privacy policy. Support lines are here too: someone may
// land on this page in a hard moment, before they ever have an account.
// Draft copy — the owner's call.

const points = [
  {
    Icon: Compass,
    title: 'The right anchor, fast',
    body: 'Tap the anchor, choose what you need, and reach a coping skill in a few seconds.',
  },
  {
    Icon: LifeBuoy,
    title: 'Distress anchors, one tap away',
    body: 'Choose a few anchors ahead of time for the hardest moments. No searching, no filtering.',
  },
  {
    Icon: Lock,
    title: 'Private by design',
    body: 'Your anchors and reflections are yours alone. No streaks, no scores, no food or weight tracking.',
  },
]

export function LandingScreen({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void
  onSignUp: () => void
}) {
  return (
    <div className="relative min-h-[100dvh] px-5 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]">
      <OceanBackdrop />

      <main className="animate-fade-rise mx-auto w-full max-w-md">
        <header className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Anchor className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">
            Anchor
          </h1>
          <p className="mt-2 text-[1.05rem] leading-relaxed text-foreground/70">
            A calm, private toolkit of coping skills for eating disorder
            recovery, there for you in the moments you need it.
          </p>
        </header>

        <div className="mt-7 flex flex-col gap-2.5">
          <button
            onClick={onSignUp}
            className="w-full rounded-xl bg-primary py-3 text-[0.95rem] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Create an account
          </button>
          <button
            onClick={onSignIn}
            className="w-full rounded-xl border border-white/70 bg-white/70 py-3 text-[0.95rem] font-semibold text-foreground shadow-sm transition-colors hover:bg-white"
          >
            Sign in
          </button>
        </div>

        <section aria-label="What Anchor does" className="mt-8 space-y-3">
          {points.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3.5 rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-md"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-[1.1rem]" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {title}
                </h2>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/65">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="landing-support" className="mt-8">
          <h2
            id="landing-support"
            className="text-xs font-medium uppercase tracking-wide text-foreground/45"
          >
            If you need to talk to someone now
          </h2>
          <div className="mt-2">
            <SupportLinks />
          </div>
        </section>

        <footer className="mt-8 text-center text-sm text-foreground/55">
          <p className="leading-relaxed">
            Anchor is a self-help tool. It isn't treatment and isn't an
            emergency service.
          </p>
          <nav aria-label="Legal" className="mt-3 flex justify-center gap-4">
            <a
              href="/privacy"
              className="font-medium text-foreground/70 underline-offset-4 hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="font-medium text-foreground/70 underline-offset-4 hover:underline"
            >
              Terms of Service
            </a>
          </nav>
        </footer>
      </main>
    </div>
  )
}
