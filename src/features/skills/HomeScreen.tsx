import { useState } from 'react'
import {
  Anchor,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  House,
  LifeBuoy,
  Menu,
  NotebookPen,
  Plus,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { SituationWheel } from '@/features/finder/SituationWheel'
import { situations } from '@/features/finder/situations'
import { CrisisScreen } from '@/features/crisis/CrisisScreen'
import { LogSheet } from '@/features/logging/LogSheet'
import { OceanBackdrop } from '@/components/OceanBackdrop'
import { MenuDrawer } from '@/components/MenuDrawer'
import { useAuth } from '@/features/auth/AuthProvider'
import { AllLogsScreen } from '@/features/history/AllLogsScreen'
import { SkillLogsScreen } from '@/features/history/SkillLogsScreen'
import { AccountScreen } from '@/features/account/AccountScreen'
import { useSkillUsageStats } from '@/features/history/useSkillUsageStats'
import { SkillSheet } from './SkillSheet'
import { SkillCard } from './SkillCard'
import { SkillDetail } from './SkillDetail'
import { SkillFilters } from './SkillFilters'
import type { Skill } from './sampleSkills'
import type { NewSkillDraft } from './skills'
import { emptyFilters, matchesFilters, type Filters } from './filters'
import { pickTodaysSkill } from './invitation'
import { compareByLatestActivity, compareSituationMatches } from './sorting'
import { useSkills } from './useSkills'
import { useCreateSkill } from './useCreateSkill'
import { useUpdateSkill } from './useUpdateSkill'

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

// The app's screens. The wheel flow (home → situation → skill) and the history
// views all live on one back-stack, so Back always steps out one level.
type Screen =
  | { k: 'home' }
  | { k: 'situation'; key: string }
  | { k: 'skill'; id: string }
  | { k: 'all-skills' }
  | { k: 'all-logs' }
  | { k: 'skill-logs'; id: string }
  | { k: 'crisis' }
  | { k: 'account' }

function screenKey(s: Screen): string {
  if (s.k === 'situation') return `situation:${s.key}`
  if (s.k === 'skill') return `skill:${s.id}`
  if (s.k === 'skill-logs') return `skill-logs:${s.id}`
  return s.k
}

// Shared style for the small circular navbar icon buttons (menu · profile).
const headerIconButton =
  'flex size-9 items-center justify-center rounded-full bg-white/55 text-foreground/70 backdrop-blur-sm transition-colors hover:bg-white/85 hover:text-foreground'

// One item in the bottom nav: icon over a label, ≥44px tall. No filled
// backgrounds, so nothing reads as "selected" except the screen you're on,
// which gets a small dot under its label.
function NavItem({
  icon: Icon,
  label,
  current,
  tone = 'neutral',
  onClick,
}: {
  icon: typeof Anchor
  label: string
  current: boolean
  tone?: 'neutral' | 'distress'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl pb-1.5 pt-2 font-semibold leading-tight transition-colors hover:bg-white/60 ${
        'min-w-11 px-1.5 text-[0.68rem]'
      } ${
        tone === 'distress'
          ? 'text-[hsl(8,52%,46%)] hover:text-[hsl(8,58%,38%)]'
          : current
            ? 'text-primary'
            : 'text-foreground/60 hover:text-foreground'
      }`}
    >
      <Icon className="size-6 shrink-0" strokeWidth={tone === 'distress' ? 1.9 : 1.75} />
      <span className="whitespace-nowrap">{label}</span>
      <span
        aria-hidden="true"
        className={`size-1 rounded-full ${current ? 'bg-current' : 'bg-transparent'}`}
      />
    </button>
  )
}

// Shared style for the "Add an Anchor" call to action on list screens.
const addAnchorButton =
  'inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'

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
  const [logOpen, setLogOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editSkill, setEditSkill] = useState<Skill | null>(null)
  const [filters, setFilters] = useState<Filters>(emptyFilters())
  const [menuOpen, setMenuOpen] = useState(false)

  const screen = stack[stack.length - 1]
  // The home screen is pinned to the viewport so the buoy area can flex-shrink
  // to fit; every other screen grows naturally and the page scrolls.
  const isHome = screen.k === 'home'
  const push = (s: Screen) => setStack((st) => [...st, s])
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st))
  // Tapping the brand always returns to a fresh home (and folds the wheel back).
  const goHome = () => {
    setStack([{ k: 'home' }])
    setExpanded(false)
  }
  // The drawer's "All …" views reset to one level deep, so Back returns home.
  const navTop = (s: Screen) => setStack([{ k: 'home' }, s])

  // Live, per-user skills from Supabase.
  const { data: skills = [], isLoading, isError } = useSkills()
  const createSkill = useCreateSkill()
  const updateSkill = useUpdateSkill()
  // Seed Today's Skill with the user + the date, so it's steady through the
  // day and gently rotates to a new one tomorrow.
  const todaySeed = `${user?.id ?? ''}:${new Date().toDateString()}`
  const todaysSkill = pickTodaysSkill(skills, todaySeed)

  // What's worked, from the user's own reflections. Unrated skills sit at a
  // neutral midpoint so lists stay alphabetical until ratings exist.
  const usageStats = useSkillUsageStats()
  const NEUTRAL_HELP = 3
  const helpScore = (id: string) =>
    usageStats.get(id)?.helpfulnessAvg ?? NEUTRAL_HELP
  const lastUsed = (id: string) => usageStats.get(id)?.lastUsedAt ?? null

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

  // The one sheet does both: update when we're editing, insert otherwise.
  const handleSubmit = async (draft: NewSkillDraft) => {
    if (editSkill) await updateSkill.mutateAsync({ skillId: editSkill.id, draft })
    else await createSkill.mutateAsync(draft)
  }

  const matches = activeSituation
    ? skills
        .filter((skill) =>
          skill.tags.some(
            (t) => t.category === 'situation' && t.label === activeSituation.key,
          ),
        )
        .sort(compareSituationMatches(activeSituation.key, helpScore))
    : []
  const visibleMatches = matches.filter((s) => matchesFilters(s, filters))

  // My Anchors: most recently added, edited, or used first.
  const allSorted = [...skills].sort(compareByLatestActivity(lastUsed))
  const visibleAll = allSorted.filter((s) => matchesFilters(s, filters))

  return (
    <div className="relative min-h-[100dvh]">
      <OceanBackdrop />

      <div
        className={`mx-auto flex max-w-md flex-col px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] ${
          // Home stops right at the nav's top edge (its footprint: 1rem
          // offset + the ~4.9rem bar), so the hint below the buoy centers between
          // the two; other screens keep extra room to scroll clear of it.
          isHome
            ? 'h-[100dvh] overflow-hidden pb-[calc(5.9rem+env(safe-area-inset-bottom))]'
            : 'min-h-[100dvh] pb-[calc(7rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {/* Navbar — menu · brand (Back replaces menu below home). Account
            lives in the bottom nav. */}
        <header className="relative flex h-9 shrink-0 items-center justify-between">
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

          <button
            onClick={goHome}
            aria-label="Anchor — go home"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full px-1 py-0.5 transition-opacity hover:opacity-80"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Anchor className="size-4" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Anchor
            </span>
          </button>

        </header>

        <div
          key={screenKey(screen)}
          className="animate-fade-rise flex min-h-0 flex-1 flex-col"
        >
          {screen.k === 'crisis' ? (
            /* Crisis mode — calm, no-filtering surface + support links */
            <CrisisScreen
              skills={skills}
              onOpenSkill={(id) => push({ k: 'skill', id })}
            />
          ) : screen.k === 'skill' ? (
            /* Skill detail — full view of one skill */
            openSkill ? (
              <SkillDetail
                skill={openSkill}
                onDone={back}
                onViewHistory={() => push({ k: 'skill-logs', id: openSkill.id })}
                onEdit={() => setEditSkill(openSkill)}
                onDeleted={back}
              />
            ) : (
              <div className="mt-5">
                <ListNotice>Gathering this anchor…</ListNotice>
              </div>
            )
          ) : screen.k === 'skill-logs' ? (
            logsSkill ? (
              <SkillLogsScreen skill={logsSkill} />
            ) : (
              <div className="mt-5">
                <ListNotice>Gathering your reflections…</ListNotice>
              </div>
            )
          ) : screen.k === 'all-logs' ? (
            <AllLogsScreen />
          ) : screen.k === 'account' ? (
            <AccountScreen />
          ) : screen.k === 'all-skills' ? (
            /* My Anchors — the full toolkit */
            <>
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-foreground">
                    My Anchors
                  </h1>
                  <button
                    onClick={() => setAddOpen(true)}
                    className={addAnchorButton}
                  >
                    <Plus className="size-4" />
                    Add an Anchor
                  </button>
                </div>
                <p className="mt-1 text-sm text-foreground/50">
                  {visibleAll.length}{' '}
                  {visibleAll.length === 1 ? 'anchor' : 'anchors'}
                </p>
              </div>
              {!isLoading && !isError && skills.length > 0 && (
                <div className="mt-3">
                  <SkillFilters filters={filters} onChange={setFilters} />
                </div>
              )}
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <ListNotice>Gathering your anchors…</ListNotice>
                ) : isError ? (
                  <ListNotice>
                    We couldn't load your anchors just now. Try again in a moment.
                  </ListNotice>
                ) : skills.length === 0 ? (
                  <ListNotice>
                    Nothing here yet — add your first anchor whenever you're
                    ready.
                  </ListNotice>
                ) : visibleAll.length === 0 ? (
                  <ListNotice>
                    No anchors match these filters — try clearing a few.
                  </ListNotice>
                ) : (
                  visibleAll.map((skill) => (
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
                  {visibleMatches.length}{' '}
                  {visibleMatches.length === 1 ? 'anchor' : 'anchors'}
                </p>
              </div>
              {!isLoading && !isError && matches.length > 0 && (
                <div className="mt-3">
                  <SkillFilters filters={filters} onChange={setFilters} />
                </div>
              )}
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <ListNotice>Gathering your anchors…</ListNotice>
                ) : isError ? (
                  <ListNotice>
                    We couldn't load your anchors just now. Check your connection
                    and try again in a moment.
                  </ListNotice>
                ) : matches.length === 0 ? (
                  <ListNotice>
                    <p>Nothing here yet.</p>
                    <button
                      onClick={() => setAddOpen(true)}
                      className={`${addAnchorButton} mt-3`}
                    >
                      <Plus className="size-4" />
                      Add an Anchor
                    </button>
                  </ListNotice>
                ) : visibleMatches.length === 0 ? (
                  <ListNotice>
                    No anchors match these filters — try clearing a few.
                  </ListNotice>
                ) : (
                  visibleMatches.map((skill) => (
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
              {/* Section 1 — greeting, gentle reminder, Today's Skill */}
              <section className="mt-5 shrink-0">
                <h1 className="font-display text-[1.7rem] font-semibold leading-tight text-foreground">
                  {timeGreeting(new Date())}, {greetingName(user)}
                </h1>
                <p className="mt-1.5 text-[0.95rem] text-foreground/60">
                  Your toolkit is here whenever you need it.
                </p>

                {todaysSkill && (
                  <div className="mt-4 rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-md">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                      Today's Skill to practice
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-foreground">
                      {todaysSkill.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-foreground/60">
                      {todaysSkill.description}
                    </p>
                    <button
                      onClick={() => push({ k: 'skill', id: todaysSkill.id })}
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      Try this
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </section>

              {/* Section 2 — the anchor; blooms into the wheel on tap */}
              {/* A size container: the buoy is a square sized to fit
                  (at most 18.5rem, and never taller than the space minus the
                  hint's minimum), so on short screens it shrinks instead of
                  colliding with the nav. Leftover space splits 1:2 above and
                  below the buoy (so it sits a little high), and the hint is
                  centered in the space below, midway between buoy and nav. */}
              <section className="mt-4 flex min-h-0 flex-1 flex-col items-center [container-type:size]">
                <div className="min-h-0 flex-[1]" />
                <div className="relative aspect-square w-[min(18.5rem,100cqw,calc(100cqh-4rem))] shrink-0">
                  <SituationWheel
                    expanded={expanded}
                    onToggle={() => setExpanded((e) => !e)}
                    onSelect={(key) => {
                      // "In distress" goes straight to distress mode — no filtering.
                      if (key === 'crisis') {
                        push({ k: 'crisis' })
                        return
                      }
                      setFilters(emptyFilters())
                      push({ k: 'situation', key })
                    }}
                  />
                </div>
                {/* A gentle hint at rest, cross-fading to the question once the
                    wheel opens — same quiet style for both. */}
                <div className="relative min-h-16 w-full flex-[2]">
                  {[
                    { text: "Tap the anchor when you're ready", shown: !expanded },
                    { text: 'What do you need right now?', shown: expanded },
                  ].map(({ text, shown }) => (
                    <p
                      key={text}
                      aria-hidden={!shown}
                      className={`absolute inset-x-0 top-1/2 mx-auto max-w-[16rem] -translate-y-1/2 text-center text-sm text-foreground/60 transition-opacity duration-300 ${
                        shown ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

      </div>

      {/* Bottom nav — Home · My Anchors · In Distress · Reflect · Account.
          Always reachable, floating over the content so it stays in reach on
          long lists. Distress is set apart by its coral icon + label only,
          and sits at the exact center: the two side groups each take half of
          the remaining width and space their items evenly. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-lg px-2"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] rounded-3xl border border-white/60 bg-white/75 px-1 py-1.5 shadow-[0_8px_24px_-8px_hsl(200_50%_40%_/_0.3)] backdrop-blur-md">
          <div className="flex justify-evenly">
            <NavItem
              icon={House}
              label="Home"
              current={screen.k === 'home'}
              onClick={goHome}
            />
            <NavItem
              icon={Anchor}
              label="My Anchors"
              current={screen.k === 'all-skills'}
              onClick={() => {
                setFilters(emptyFilters())
                navTop({ k: 'all-skills' })
              }}
            />
          </div>
          <NavItem
            icon={LifeBuoy}
            label="In Distress"
            tone="distress"
            current={screen.k === 'crisis'}
            onClick={() => navTop({ k: 'crisis' })}
          />
          <div className="flex justify-evenly">
            <NavItem
              icon={NotebookPen}
              label="Reflect"
              current={false}
              onClick={() => setLogOpen(true)}
            />
            <NavItem
              icon={CircleUser}
              label="Account"
              current={screen.k === 'account'}
              onClick={() => navTop({ k: 'account' })}
            />
          </div>
        </div>
      </nav>

      <MenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCrisis={() => navTop({ k: 'crisis' })}
        onAddSkill={() => setAddOpen(true)}
        onLogUsage={() => setLogOpen(true)}
        onAllSkills={() => {
          setFilters(emptyFilters())
          navTop({ k: 'all-skills' })
        }}
        onAllLogs={() => navTop({ k: 'all-logs' })}
      />
      <LogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        skills={skills}
        onViewReflections={() => navTop({ k: 'all-logs' })}
        onAddNew={() => setAddOpen(true)}
      />
      <SkillSheet
        open={addOpen || editSkill !== null}
        onClose={() => {
          setAddOpen(false)
          setEditSkill(null)
        }}
        onSubmit={handleSubmit}
        defaultSituation={screen.k === 'situation' ? screen.key : null}
        skill={editSkill}
      />
    </div>
  )
}
