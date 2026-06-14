import { useState } from 'react'
import {
  Anchor,
  Check,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { useAuth } from '@/features/auth/AuthProvider'
import { completeOnboarding } from '@/features/auth/auth'
import { useSkills } from '@/features/skills/useSkills'
import { useCreateSkill } from '@/features/skills/useCreateSkill'
import { SkillSheet } from '@/features/skills/SkillSheet'
import type { NewSkillDraft } from '@/features/skills/skills'
import { CrisisSetupSheet } from '@/features/crisis/CrisisSetupSheet'

// First-run setup, one calm screen at a time: welcome → name → add a few skills
// → confirm the crisis set → done. Completing it writes a flag to user_metadata
// so it never shows again. Everything is skippable — never a wall.
const STEP_COUNT = 5

export function OnboardingFlow() {
  const { user } = useAuth()
  const { data: skills = [] } = useSkills()
  const createSkill = useCreateSkill()

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

  const inputClass =
    'w-full rounded-xl border border-border bg-white/70 p-3 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="relative flex min-h-[100dvh] flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
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
          key={step}
          className="animate-fade-rise flex min-h-0 flex-1 flex-col justify-center py-8"
        >
          {step === 0 && (
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
                Hello{first ? `, ${first}` : ''}.
              </h1>
              <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                Welcome to Anchor — a calm place to reach the coping skill you need,
                right when you need it. Let's take a minute to set up your toolkit
                together. You can change anything later.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight text-foreground">
                First, what should we call you?
              </h1>
              <p className="mt-2 text-sm text-foreground/60">
                Just for a warm hello when you open the app. Optional.
              </p>
              <div className="mt-5 space-y-2.5">
                <input
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  className={inputClass}
                />
                <input
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex min-h-0 flex-1 flex-col">
              <h1 className="shrink-0 font-display text-2xl font-semibold leading-tight text-foreground">
                Add a few skills
              </h1>
              <p className="mt-2 shrink-0 text-sm text-foreground/60">
                You're starting with a few to get going. Add any of your own that
                help you — you can always add more later.
              </p>
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {skills.length === 0 ? (
                  <p className="rounded-2xl border border-white/60 bg-white/55 p-4 text-center text-sm text-foreground/55 backdrop-blur-md">
                    Add your first skill below.
                  </p>
                ) : (
                  skills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur-md"
                    >
                      <Sparkles className="size-4 shrink-0 text-primary/70" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {s.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-3 flex shrink-0 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="size-4" />
                Add a skill
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex min-h-0 flex-1 flex-col">
              <h1 className="shrink-0 font-display text-2xl font-semibold leading-tight text-foreground">
                Set up your crisis skills
              </h1>
              <p className="mt-2 shrink-0 text-sm leading-relaxed text-foreground/60">
                These are the ones you'll reach for first in a hard moment — one tap
                away, no searching. We've started you off with a few; reorder or
                change them to fit you.
              </p>
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                {crisisSkills.length === 0 ? (
                  <p className="rounded-2xl border border-white/60 bg-white/55 p-4 text-center text-sm text-foreground/55 backdrop-blur-md">
                    No crisis skills yet — choose a few below.
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
                Choose &amp; reorder crisis skills
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Check className="size-8" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold leading-tight text-foreground">
                You're all set{first ? `, ${first}` : ''}.
              </h1>
              <p className="mt-3 text-[0.97rem] leading-relaxed text-foreground/65">
                Your toolkit is ready. It's here whenever you need it — gently, at
                your own pace.
              </p>
              {error && (
                <p className="mt-3 text-sm text-destructive">
                  Something went wrong finishing setup. Please try again.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="shrink-0">
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
              onClick={isLast ? finish : next}
              disabled={finishing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {finishing && <Loader2 className="size-4 animate-spin" />}
              {step === 0
                ? 'Get started'
                : isLast
                  ? 'Enter your toolkit'
                  : 'Continue'}
              {!isLast && <ChevronRight className="size-4" />}
            </button>
          </div>
          {!isLast && (
            <button
              onClick={finish}
              disabled={finishing}
              className="mt-3 w-full text-center text-sm font-medium text-foreground/45 transition-colors hover:text-foreground/70 disabled:opacity-60"
            >
              Skip for now
            </button>
          )}
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
