import { useEffect, useState, type ReactNode } from 'react'
import {
  Anchor,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  LifeBuoy,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { useAuth } from '@/features/auth/AuthProvider'
import { completeOnboarding } from '@/features/auth/auth'
import { useSkills } from '@/features/skills/useSkills'
import { useCreateSkill } from '@/features/skills/useCreateSkill'
import { useDeleteSkill } from '@/features/skills/useDeleteSkill'
import { SkillSheet } from '@/features/skills/SkillSheet'
import type { NewSkillDraft } from '@/features/skills/skills'
import type { Skill } from '@/features/skills/sampleSkills'
import { CrisisSetupSheet } from '@/features/crisis/CrisisSetupSheet'

// First-run setup, one calm screen at a time: welcome → name → what anchors are
// → what distress anchors are → starter anchors → confirm the distress set →
// done. Completing it writes a flag to user_metadata
// so it never shows again. Everything is skippable — never a wall.
const STEP_COUNT = 7

// How many of the seeded default anchors the starter step shows.
const STARTER_COUNT = 4

// The starter anchors: the first few seeded defaults (seed order, then title).
function pickStarters(skills: Skill[]): string[] {
  return skills
    .filter((s) => s.isDefault)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.title.localeCompare(b.title))
    .slice(0, STARTER_COUNT)
    .map((s) => s.id)
}

// Progressive build: a piece that fades up after `delay` seconds, over
// `duration` seconds.
function Reveal({
  delay = 0,
  duration = 0.6,
  children,
}: {
  delay?: number
  duration?: number
  children: ReactNode
}) {
  return (
    <div
      className="animate-fade-rise"
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
    >
      {children}
    </div>
  )
}

// The slower welcome/greeting/finish rhythm: each piece fades in over 1s, with
// a 0.25s pause before the next (so they start at 0s, 1.25s, 2.5s, …).
const SLOW_FADE = 1
const SLOW_PAUSE = 0.25
const slowBeat = (i: number) => i * (SLOW_FADE + SLOW_PAUSE)

// Large, centered brand mark for the welcome, name, and explainer steps.
function AnchorLogo() {
  return (
    <span className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-primary/15 text-primary">
      <Anchor className="size-12" strokeWidth={1.75} />
    </span>
  )
}

// The coral life buoy used for distress everywhere else (wheel, nav, menu).
function DistressLogo() {
  return (
    <span className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-[hsl(10,76%,93%)] text-[hsl(8,58%,52%)]">
      <LifeBuoy className="size-12" strokeWidth={1.75} />
    </span>
  )
}

// Smaller marks above the headers of the list steps.
function StepMark({ distress = false }: { distress?: boolean }) {
  return (
    <span
      className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${
        distress
          ? 'bg-[hsl(10,76%,93%)] text-[hsl(8,58%,52%)]'
          : 'bg-primary/15 text-primary'
      }`}
    >
      {distress ? (
        <LifeBuoy className="size-7" strokeWidth={1.9} />
      ) : (
        <Anchor className="size-7" strokeWidth={1.75} />
      )}
    </span>
  )
}

// One anchor on the starter step: (i) shows its description, read-only. Only
// anchors the user added here can be removed (−); the starters stay.
function StarterRow({ skill, onRemove }: { skill: Skill; onRemove?: () => void }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 px-3 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate pl-1 text-sm font-medium text-foreground">
          {skill.title}
        </span>
        {skill.description && (
          <button
            onClick={() => setShowInfo((v) => !v)}
            aria-expanded={showInfo}
            aria-label={`About ${skill.title}`}
            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/70 ${
              showInfo ? 'text-primary' : 'text-foreground/45'
            }`}
          >
            <Info className="size-5" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${skill.title}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Minus className="size-3.5" strokeWidth={3} />
            </span>
          </button>
        )}
      </div>
      {showInfo && (
        <p className="px-1 pb-1 pt-1.5 text-sm leading-relaxed text-foreground/60">
          {skill.description}
        </p>
      )}
    </div>
  )
}

export function OnboardingFlow() {
  const { user } = useAuth()
  const { data: skills = [] } = useSkills()
  const createSkill = useCreateSkill()
  const deleteSkill = useDeleteSkill()

  // Pre-fill from any name we already have (e.g. from Google sign-in).
  const existingName = (user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    '') as string
  const [first, setFirst] = useState(existingName.split(' ')[0] ?? '')
  const [last, setLast] = useState(
    existingName.split(' ').slice(1).join(' ') ?? '',
  )

  const [step, setStep] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [crisisOpen, setCrisisOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState(false)
  // A brief "Nice to meet you" after the name step, before moving on.
  const [greeting, setGreeting] = useState(false)
  useEffect(() => {
    if (!greeting) return
    const timer = setTimeout(() => {
      setGreeting(false)
      setStep(2)
    }, 4000)
    return () => clearTimeout(timer)
  }, [greeting])

  // Fix the starter set once the anchors first load, so removing one never
  // pulls a different default in to take its place.
  const [starterIds, setStarterIds] = useState<string[] | null>(null)
  useEffect(() => {
    if (starterIds === null && skills.length > 0) setStarterIds(pickStarters(skills))
  }, [skills, starterIds])
  // The starters still in the toolkit, then anything the user added here.
  const shownAnchors = skills.filter(
    (s) => (starterIds ?? []).includes(s.id) || !s.isDefault,
  )

  const crisisSkills = skills
    .filter((s) => s.crisisPriority != null)
    .sort((a, b) => (a.crisisPriority ?? 0) - (b.crisisPriority ?? 0))

  const finish = async () => {
    setError(false)
    setFinishing(true)
    try {
      await completeOnboarding(`${first} ${last}`.trim())
      // The auth listener picks up the updated session and swaps in the app.
    } catch {
      setError(true)
      setFinishing(false)
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, STEP_COUNT - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const isLast = step === STEP_COUNT - 1
  // The name step is required — both fields before Continue unlocks.
  const nameValid = first.trim().length > 0 && last.trim().length > 0

  const inputClass =
    'w-full rounded-xl border border-border bg-white/70 p-3 text-base text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-9 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <OceanBackdrop />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Brand + progress */}
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Anchor className="size-4" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Anchor
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-5 bg-primary' : 'w-1.5 bg-foreground/15'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div
          key={greeting ? 'greeting' : step}
          className="animate-fade-rise flex min-h-0 flex-1 flex-col justify-center py-8"
        >
          {greeting && (
            <div className="px-2 text-center">
              <Reveal delay={slowBeat(0)} duration={SLOW_FADE}>
                <p className="font-display text-3xl font-semibold leading-tight text-foreground">
                  Nice to meet you, {first.trim()}.
                </p>
              </Reveal>
              <Reveal delay={slowBeat(1)} duration={SLOW_FADE}>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                  Let's get you set up with Anchor.
                </p>
              </Reveal>
            </div>
          )}

          {!greeting && step === 0 && (
            <div className="px-2 text-center">
              <Reveal delay={slowBeat(0)} duration={SLOW_FADE}>
                <AnchorLogo />
                <h1 className="mt-6 font-display text-3xl font-semibold leading-tight text-foreground">
                  Hello{first ? `, ${first}` : ''}.
                </h1>
              </Reveal>
              <Reveal delay={slowBeat(1)} duration={SLOW_FADE}>
                <p className="mt-2 font-display text-xl font-semibold text-foreground/75">
                  Welcome to Anchor
                </p>
              </Reveal>
              {/* A longer 0.5s breath before the body, on this screen only. */}
              <Reveal delay={slowBeat(1) + SLOW_FADE + 0.5} duration={SLOW_FADE}>
                <p className="mt-8 text-[0.97rem] leading-relaxed text-foreground/65">
                  Let's take a minute to set up your coping skill toolkit
                  together. You can change anything later.
                </p>
              </Reveal>
            </div>
          )}

          {!greeting && step === 1 && (
            <div className="text-center">
              <AnchorLogo />
              <h1 className="mt-6 font-display text-2xl font-semibold leading-tight text-foreground">
                First, what should we call you?
              </h1>
              <p className="mt-2 text-sm text-foreground/60">
                Just for a warm hello when you open the app.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 text-left">
                <input
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  placeholder="First name"
                  aria-label="First name"
                  autoComplete="given-name"
                  className={inputClass}
                />
                <input
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  placeholder="Last name"
                  aria-label="Last name"
                  autoComplete="family-name"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {!greeting && step === 2 && (
            <div className="px-2 text-center">
              <Reveal delay={0}>
                <AnchorLogo />
                <h1 className="mt-6 font-display text-2xl font-semibold leading-tight text-foreground">
                  Anchors are your coping skills
                </h1>
              </Reveal>
              <Reveal delay={0.5}>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                  Small, healthy things to reach for when you're feeling
                  activated, so you can lean on them instead of ED behaviors.
                </p>
              </Reveal>
            </div>
          )}

          {!greeting && step === 3 && (
            <div className="px-2 text-center">
              <Reveal delay={0}>
                <DistressLogo />
                <h1 className="mt-6 font-display text-2xl font-semibold leading-tight text-foreground">
                  Distress anchors are for the hardest moments
                </h1>
              </Reveal>
              <Reveal delay={0.5}>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                  When urges or feelings get really loud, you can turn to your
                  distress anchors: a few you choose ahead of time, kept together
                  so they're ready when you need them most.
                </p>
              </Reveal>
            </div>
          )}

          {!greeting && step === 4 && (
            <div className="flex min-h-0 flex-1 flex-col">
              <StepMark />
              <h1 className="mt-4 shrink-0 font-display text-2xl font-semibold leading-tight text-foreground">
                Your starting anchors
              </h1>
              <p className="mt-2 shrink-0 text-sm text-foreground/60">
                You can always change these later.
              </p>
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {shownAnchors.length === 0 ? (
                  <p className="rounded-2xl border border-white/60 bg-white/55 p-4 text-center text-sm text-foreground/55 backdrop-blur-md">
                    Add your first anchor below.
                  </p>
                ) : (
                  shownAnchors.map((s) => (
                    <StarterRow
                      key={s.id}
                      skill={s}
                      onRemove={s.isDefault ? undefined : () => deleteSkill.mutate(s.id)}
                    />
                  ))
                )}
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-3 flex shrink-0 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="size-4" />
                Add an Anchor
              </button>
            </div>
          )}

          {!greeting && step === 5 && (
            <div className="flex min-h-0 flex-1 flex-col">
              <StepMark distress />
              <h1 className="mt-4 shrink-0 font-display text-2xl font-semibold leading-tight text-foreground">
                Your distress anchors
              </h1>
              <p className="mt-2 shrink-0 text-sm leading-relaxed text-foreground/60">
                Think about what truly helps you when things get really hard. These
                are the anchors you'll see first when you tap “In Distress.” We've
                started you with a few. Change them or put them in the order that
                feels right to you.
              </p>
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {crisisSkills.length === 0 ? (
                  <p className="rounded-2xl border border-white/60 bg-white/55 p-4 text-center text-sm text-foreground/55 backdrop-blur-md">
                    No distress anchors yet, and that's okay. You can choose a few
                    below, now or whenever you're ready.
                  </p>
                ) : (
                  crisisSkills.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2.5 rounded-2xl border border-transparent bg-[hsl(10,76%,93%)] px-4 py-3"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[hsl(8,64%,58%)] text-xs font-semibold text-white">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[hsl(8,50%,38%)]">
                        {s.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setCrisisOpen(true)}
                className="mt-3 flex shrink-0 w-full items-center justify-center gap-2 rounded-2xl border border-[hsl(8,64%,58%)]/40 bg-[hsl(10,76%,93%)]/60 py-3 text-sm font-semibold text-[hsl(8,50%,42%)] transition-colors hover:bg-[hsl(10,76%,93%)]"
              >
                <LifeBuoy className="size-4" />
                Update distress anchors
              </button>
            </div>
          )}

          {!greeting && step === 6 && (
            <div className="px-2 text-center">
              <Reveal delay={slowBeat(0)} duration={SLOW_FADE}>
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Check className="size-8" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-semibold leading-tight text-foreground">
                  You're all set{first ? `, ${first}` : ''}.
                </h1>
              </Reveal>
              <Reveal delay={slowBeat(1)} duration={SLOW_FADE}>
                <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                  Your anchors are ready, here whenever you need them.
                </p>
              </Reveal>
              {error && (
                <p className="mt-3 text-sm text-destructive">
                  Something went wrong finishing setup. Please try again.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav (held invisible during the greeting, so nothing jumps) */}
        <div className={`shrink-0 ${greeting ? 'invisible' : ''}`}>
          <div className="flex items-center gap-3">
            {step > 0 && !isLast && (
              <button
                onClick={back}
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-foreground/70 transition-colors hover:bg-white hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            <button
              onClick={isLast ? finish : step === 1 ? () => setGreeting(true) : next}
              disabled={finishing || (step === 1 && !nameValid)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {finishing && <Loader2 className="size-4 animate-spin" />}
              {step === 0
                ? 'Get started'
                : isLast
                  ? 'Enter Anchor'
                  : 'Continue'}
              {!isLast && <ChevronRight className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <SkillSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (draft: NewSkillDraft) => {
          await createSkill.mutateAsync(draft)
        }}
        defaultSituation={null}
        skill={null}
      />
      <CrisisSetupSheet
        open={crisisOpen}
        onClose={() => setCrisisOpen(false)}
        skills={skills}
      />
    </div>
  )
}
