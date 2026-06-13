import { useState } from 'react'
import {
  Anchor,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  LogOut,
  Menu,
  NotebookPen,
  Phone,
  Plus,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { SituationWheel } from '@/features/finder/SituationWheel'
import { situations } from '@/features/finder/situations'
import { SupportDrawer } from '@/features/crisis/SupportDrawer'
import { LogSheet } from '@/features/logging/LogSheet'
import { OceanBackdrop } from '@/components/OceanBackdrop'
import { MenuDrawer } from '@/components/MenuDrawer'
import { useAuth } from '@/features/auth/AuthProvider'
import { signOut } from '@/features/auth/auth'
import { AllLogsScreen } from '@/features/history/AllLogsScreen'
import { SkillLogsScreen } from '@/features/history/SkillLogsScreen'
import { AddSkillSheet } from './AddSkillSheet'
import { SkillCard } from './SkillCard'
import { SkillDetail } from './SkillDetail'
import type { Skill } from './sampleSkills'
import type { NewSkillDraft } from './skills'
import { useSkills } from './useSkills'
import { useCreateSkill } from './useCreateSkill'

// A friendly first name for the greeting: Google's profile name if we have it,
// otherwise the part of the email before the @, else a gentle fallback.
function greetingName(user: User | null): string {
  const meta = user?.user_metadata ?? {}
  const full = (meta.full_name ?? meta.name) as string | undefined
  if (full) return full.split(' ')[0]
  const email = user?.email
  if (email) return email.split('@')[0]
  return 'there'
}

// Gentle, time-aware greeting.
function timeGreeting(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Hello'
}

// A softly-suggested skill to try today — a gentle, low-effort one from the
// user's own toolkit, falling back to whatever's first.
function pickInvitation(skills: Skill[]): Skill | null {
  const lowEffort = skills.find((s) =>
    s.tags.some((t) => t.category === 'effort' && t.label === 'low'),
  )
  return lowEffort ?? skills[0] ?? null
}

// The app's screens. The wheel flow (home → situation → skill) and the history
// views all live on one back-stack, so Back always steps out one level.
type Screen =
  | { k: 'home' }
  | { k: 'situation'; key: string }
  | { k: 'skill'; id: string }
  | { k: 'all-skills' }
  | { k: 'all-logs' }
  | { k: 'skill-logs'; id: string }

function screenKey(s: Screen): string {
  if (s.k === 'situation') return `situation:${s.key}`
  if (s.k === 'skill') return `skill:${s.id}`
  if (s.k === 'skill-logs') return `skill-logs:${s.id}`
  return s.k
}

// Shared style for the small circular navbar icon buttons (menu · profile).
const headerIconButton =
  'flex size-9 items-center justify-center rounded-full bg-white/55 text-foreground/70 backdrop-blur-sm transition-colors hover:bg-white/85 hover:text-foreground'

// Shared style for the bottom action buttons (add · support · log).
const bottomButton =
  'flex size-14 items-center justify-center rounded-full border border-white/60 bg-white/65 text-foreground/65 shadow-[0_8px_24px_-8px_hsl(200_50%_40%_/_0.3)] backdrop-blur-md transition-colors hover:bg-white hover:text-foreground'

// Gentle fallback shown in a list slot while skills load / on error / when empty.
function ListNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/55 p-6 text-center text-sm text-foreground/60 backdrop-blur-md">
      {children}
    </div>
  )
}

export function HomeScreen() {
  const { user } = useAuth()
  const [stack, setStack] = useState<Screen[]>([{ k: 'home' }])
  const [expanded, setExpanded] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const screen = stack[stack.length - 1]
  const push = (s: Screen) => setStack((st) => [...st, s])
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st))
  // The drawer's "All …" views reset to one level deep, so Back returns home.
  const navTop = (s: Screen) => setStack([{ k: 'home' }, s])

  // Live, per-user skills from Supabase.
  const { data: skills = [], isLoading, isError } = useSkills()
  const createSkill = useCreateSkill()
  const invitation = pickInvitation(skills)

  const activeSituation =
    screen.k === 'situation'
      ? situations.find((s) => s.key === screen.key) ?? null
      : null
  const openSkill =
    screen.k === 'skill' ? skills.find((s) => s.id === screen.id) ?? null : null
  const logsSkill =
    screen.k === 'skill-logs'
      ? skills.find((s) => s.id === screen.id) ?? null
      : null

  const handleCreate = async (draft: NewSkillDraft) => {
    await createSkill.mutateAsync(draft)
  }

  const matches = activeSituation
    ? skills
        .filter((skill) =>
          skill.tags.some(
            (t) => t.category === 'situation' && t.label === activeSituation.key,
          ),
        )
        // In crisis, lead with the highest-priority steadying skills.
        .sort((a, b) =>
          activeSituation.key === 'crisis'
            ? (a.crisisPriority ?? 99) - (b.crisisPriority ?? 99)
            : 0,
        )
    : []

  return (
    <div className="relative min-h-screen">
      <OceanBackdrop />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-6 pt-6">
        {/* Navbar — menu · brand · profile (Back replaces menu below home) */}
        <header className="relative flex h-9 items-center justify-between">
          {stack.length > 1 ? (
            <button
              onClick={back}
              className="flex items-center gap-1 rounded-full bg-white/55 py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground/75 backdrop-blur-sm transition-colors hover:bg-white/85 hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          ) : (
            <button
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className={headerIconButton}
            >
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

          <div className="relative">
            <button
              aria-label="Account"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((o) => !o)}
              className={headerIconButton}
            >
              <CircleUser className="size-5" />
            </button>

            {profileOpen && (
              <>
                {/* Click-away scrim */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="animate-fade-rise absolute right-0 top-11 z-50 w-60 rounded-2xl border border-white/60 bg-[hsl(196,54%,98%)]/95 p-4 shadow-[0_16px_40px_-16px_hsl(200_50%_40%_/_0.4)] backdrop-blur-md">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                    Signed in as
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {user?.email ?? 'your account'}
                  </p>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      void signOut()
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/70 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-white hover:text-foreground"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div
          key={screenKey(screen)}
          className="animate-fade-rise flex flex-1 flex-col"
        >
          {screen.k === 'skill' ? (
            /* Skill detail — full view of one skill */
            openSkill ? (
              <SkillDetail
                skill={openSkill}
                onDone={back}
                onViewHistory={() => push({ k: 'skill-logs', id: openSkill.id })}
              />
            ) : (
              <div className="mt-5">
                <ListNotice>Gathering this skill…</ListNotice>
              </div>
            )
          ) : screen.k === 'skill-logs' ? (
            logsSkill ? (
              <SkillLogsScreen skill={logsSkill} />
            ) : (
              <div className="mt-5">
                <ListNotice>Gathering your history…</ListNotice>
              </div>
            )
          ) : screen.k === 'all-logs' ? (
            <AllLogsScreen />
          ) : screen.k === 'all-skills' ? (
            /* All skills — the full toolkit, alphabetical */
            <>
              <div className="mt-5">
                <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-foreground">
                  All skills
                </h1>
                <p className="mt-1 text-sm text-foreground/50">
                  {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <ListNotice>Gathering your skills…</ListNotice>
                ) : isError ? (
                  <ListNotice>
                    We couldn't load your skills just now. Try again in a moment.
                  </ListNotice>
                ) : skills.length === 0 ? (
                  <ListNotice>
                    Nothing here yet — you can add a skill with the + below.
                  </ListNotice>
                ) : (
                  [...skills]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onOpen={() => push({ k: 'skill', id: skill.id })}
                      />
                    ))
                )}
              </div>
            </>
          ) : screen.k === 'situation' && activeSituation ? (
            /* Filtered view — skills for the chosen situation */
            <>
              <div className="mt-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground/45">
                  {activeSituation.label}
                </p>
                <h1 className="mt-1 font-display text-[1.6rem] font-semibold leading-tight text-foreground">
                  {activeSituation.heading}
                </h1>
                <p className="mt-1 text-sm text-foreground/50">
                  {matches.length} {matches.length === 1 ? 'skill' : 'skills'}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <ListNotice>Gathering your skills…</ListNotice>
                ) : isError ? (
                  <ListNotice>
                    We couldn't load your skills just now. Check your connection
                    and try again in a moment.
                  </ListNotice>
                ) : matches.length === 0 ? (
                  <ListNotice>
                    Nothing here yet — you can add a skill with the + below.
                  </ListNotice>
                ) : (
                  matches.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onOpen={() => push({ k: 'skill', id: skill.id })}
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
                  {timeGreeting(new Date())}, {greetingName(user)}
                </h1>
                <p className="mt-1.5 text-[0.95rem] text-foreground/60">
                  Your toolkit is here whenever you need it.
                </p>

                {invitation && (
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
                      onClick={() => push({ k: 'skill', id: invitation.id })}
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      Try this
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
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
                    onSelect={(key) => push({ k: 'situation', key })}
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
            onClick={() => setAddOpen(true)}
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

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAddSkill={() => setAddOpen(true)}
        onLogUsage={() => setLogOpen(true)}
        onAllSkills={() => navTop({ k: 'all-skills' })}
        onAllLogs={() => navTop({ k: 'all-logs' })}
      />
      <SupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LogSheet open={logOpen} onClose={() => setLogOpen(false)} skills={skills} />
      <AddSkillSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
        defaultSituation={screen.k === 'situation' ? screen.key : null}
      />
    </div>
  )
}
