import { useState } from 'react'
import {
  Anchor,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Menu,
  NotebookPen,
  Phone,
  Plus,
} from 'lucide-react'

import { SituationWheel } from '@/features/finder/SituationWheel'
import { situations } from '@/features/finder/situations'
import { SupportDrawer } from '@/features/crisis/SupportDrawer'
import { LogSheet } from '@/features/logging/LogSheet'
import { SkillCard } from './SkillCard'
import { SkillDetail } from './SkillDetail'
import { sampleSkills } from './sampleSkills'

// Placeholder until profiles land — this will come from the signed-in user.
const userName = 'Sam'

// Gentle, time-aware greeting.
function timeGreeting(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Hello'
}

// A softly-suggested skill to try today. Static placeholder for the mockup;
// later this could rotate from the user's gentler, lower-effort skills.
const invitation = sampleSkills.find((s) => s.id === 'walk')!

// Shared style for the small circular navbar icon buttons (menu · profile).
const headerIconButton =
  'flex size-9 items-center justify-center rounded-full bg-white/55 text-foreground/70 backdrop-blur-sm transition-colors hover:bg-white/85 hover:text-foreground'

// Shared style for the bottom action buttons (add · support · log).
const bottomButton =
  'flex size-14 items-center justify-center rounded-full border border-white/60 bg-white/65 text-foreground/65 shadow-[0_8px_24px_-8px_hsl(200_50%_40%_/_0.3)] backdrop-blur-md transition-colors hover:bg-white hover:text-foreground'

// Rising bubbles, hand-placed so the motion feels composed rather than random.
const bubbles = [
  { left: '8%', size: 10, delay: '0s', duration: '8s' },
  { left: '22%', size: 6, delay: '2.5s', duration: '10s' },
  { left: '47%', size: 14, delay: '1s', duration: '9s' },
  { left: '68%', size: 8, delay: '3.5s', duration: '11s' },
  { left: '85%', size: 11, delay: '0.8s', duration: '8.5s' },
  { left: '92%', size: 5, delay: '4s', duration: '12s' },
]

function OceanBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Depth gradient — pale sky surface fading into deeper water */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(198,72%,97%)] via-[hsl(193,58%,90%)] to-[hsl(189,48%,82%)]" />
      {/* Soft caustics / sunlight, slowly drifting */}
      <div className="animate-drift absolute -left-16 -top-10 size-72 rounded-full bg-white/50 blur-3xl" />
      <div
        className="animate-drift absolute -right-10 top-40 size-80 rounded-full bg-[hsl(186,70%,80%)]/40 blur-3xl"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="animate-drift absolute bottom-10 left-1/4 size-72 rounded-full bg-[hsl(200,80%,88%)]/45 blur-3xl"
        style={{ animationDelay: '6s' }}
      />
      {/* Rising bubbles */}
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="animate-rise absolute bottom-24 rounded-full border border-white/60 bg-white/40"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </div>
  )
}

export function HomeScreen() {
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [openSkillId, setOpenSkillId] = useState<string | null>(null)

  const active = situations.find((s) => s.key === selected) ?? null
  const openSkill = sampleSkills.find((s) => s.id === openSkillId) ?? null

  // Back steps out one level at a time: skill detail → list → home.
  const goBack = () => {
    if (openSkill) setOpenSkillId(null)
    else setSelected(null)
  }

  const matches = active
    ? sampleSkills
        .filter((skill) =>
          skill.tags.some(
            (t) => t.category === 'situation' && t.label === active.key,
          ),
        )
        // In crisis, lead with the highest-priority steadying skills.
        .sort((a, b) =>
          active.key === 'crisis'
            ? (a.crisisPriority ?? 99) - (b.crisisPriority ?? 99)
            : 0,
        )
    : []

  return (
    <div className="relative min-h-screen">
      <OceanBackdrop />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-6">
        {/* Navbar — menu · brand · profile (Back replaces menu in a situation) */}
        <header className="relative flex h-9 items-center justify-between">
          {active || openSkill ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 rounded-full bg-white/55 py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground/75 backdrop-blur-sm transition-colors hover:bg-white/85 hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          ) : (
            <button aria-label="Menu" className={headerIconButton}>
              <Menu className="size-5" />
            </button>
          )}

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Anchor className="size-4" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Anchor
            </span>
          </div>

          <button aria-label="Profile" className={headerIconButton}>
            <CircleUser className="size-5" />
          </button>
        </header>

        <div
          key={openSkillId ?? active?.key ?? 'home'}
          className="animate-fade-rise flex flex-1 flex-col"
        >
          {openSkill ? (
            /* Skill detail — full view of one skill */
            <SkillDetail skill={openSkill} onDone={goBack} />
          ) : active ? (
            /* Filtered view — skills for the chosen situation */
            <>
              <div className="mt-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground/45">
                  {active.label}
                </p>
                <h1 className="mt-1 font-display text-[1.6rem] font-semibold leading-tight text-foreground">
                  {active.heading}
                </h1>
                <p className="mt-1 text-sm text-foreground/50">
                  {matches.length} {matches.length === 1 ? 'skill' : 'skills'}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {matches.length === 0 ? (
                  <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center text-sm text-foreground/60 backdrop-blur-md">
                    Nothing here yet — you can add a skill with the + below.
                  </div>
                ) : (
                  matches.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onOpen={() => setOpenSkillId(skill.id)}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            /* Home — greeting section, then the anchor section */
            <>
              {/* Section 1 — greeting, gentle reminder, a small invitation */}
              <section className="mt-5">
                <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-foreground">
                  {timeGreeting(new Date())}, {userName}
                </h1>
                <p className="mt-1.5 text-[0.95rem] text-foreground/60">
                  Your toolkit is here whenever you need it.
                </p>

                <div className="mt-4 rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-md">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                    A small invitation
                  </p>
                  <p className="mt-1 font-display text-base font-semibold text-foreground">
                    {invitation.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-foreground/60">
                    {invitation.description}
                  </p>
                  <button
                    onClick={() => setOpenSkillId(invitation.id)}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    Try this
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </section>

              {/* Section 2 — the anchor; blooms into the wheel on tap */}
              <section className="mt-9 flex flex-1 flex-col">
                {/* Heading cross-fades between the resting + active prompts in
                    the same slot and the same format. */}
                <div className="relative h-9">
                  <h2
                    className={`absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-xl font-semibold text-foreground transition-opacity duration-300 ${
                      expanded ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    Find your anchor
                  </h2>
                  <h2
                    className={`absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display text-xl font-semibold text-foreground transition-opacity duration-300 ${
                      expanded ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    What do you need right now?
                  </h2>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center">
                  <SituationWheel
                    expanded={expanded}
                    onToggle={() => setExpanded((e) => !e)}
                    onSelect={setSelected}
                  />
                  {/* Fixed-height slot so the hint never reflows the buoy; the
                      two messages cross-fade, capped to the buoy's width. */}
                  <div className="relative mt-3 h-12 w-full">
                    <p
                      className={`absolute inset-x-0 top-1/2 mx-auto max-w-[16rem] -translate-y-1/2 text-center text-sm text-foreground/60 transition-opacity duration-300 ${
                        expanded ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      Tap the anchor when you're ready
                    </p>
                    <p
                      className={`absolute inset-x-0 top-1/2 mx-auto max-w-[16rem] -translate-y-1/2 text-center text-sm text-foreground/60 transition-opacity duration-300 ${
                        expanded ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      Pick one that would help, or tap the anchor again to go back
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Bottom actions — add a skill · support · log a use. Always reachable.
            Each side button sits centered between the phone and the edge. */}
        <div className="relative mt-4 h-14 w-full">
          <button
            aria-label="Add a coping skill"
            className={`${bottomButton} absolute left-1/4 top-0 -translate-x-1/2`}
          >
            <Plus className="size-6" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Get support"
            className={`${bottomButton} absolute left-1/2 top-0 -translate-x-1/2`}
          >
            <Phone className="size-6" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setLogOpen(true)}
            aria-label="Log a coping skill"
            className={`${bottomButton} absolute left-3/4 top-0 -translate-x-1/2`}
          >
            <NotebookPen className="size-6" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <SupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        skills={sampleSkills}
      />
    </div>
  )
}
