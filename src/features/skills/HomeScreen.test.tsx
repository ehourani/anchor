import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { makeSkill, tag } from '@/test/fixtures'
import type { Skill } from './sampleSkills'
import { HomeScreen } from './HomeScreen'

// Core-loop tests over the real HomeScreen. Data hooks are mocked with
// fixtures; the Supabase client itself is a throwing guard (src/test/setup.ts).
const state = vi.hoisted(() => ({
  skills: [] as Skill[],
  meta: {} as Record<string, unknown>,
}))
const tour = vi.hoisted(() => ({ completeTour: vi.fn() }))
const logger = vi.hoisted(() => ({ startLog: vi.fn(), saveReflection: vi.fn() }))
const creator = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'sam@example.com',
      user_metadata: { full_name: 'Sam Rivera', ...state.meta },
    },
    session: {},
    loading: false,
  }),
}))
vi.mock('@/features/auth/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/auth')>()),
  completeTour: tour.completeTour,
}))
vi.mock('./useSkills', () => ({
  skillsQueryKey: (userId: string | undefined) => ['skills', userId],
  useSkills: () => ({ data: state.skills, isLoading: false, isError: false }),
}))
vi.mock('@/features/history/useUsageLogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/history/useUsageLogs')>()),
  useUsageLogs: () => ({ data: [], isLoading: false, isError: false }),
}))
vi.mock('@/features/logging/useUsageLogger', () => ({
  useUsageLogger: () => logger,
}))
vi.mock('./useCreateSkill', () => ({
  useCreateSkill: () => creator,
}))

const grounding = makeSkill({
  id: 'grounding',
  title: 'Grounding 5-4-3-2-1',
  crisisPriority: 1,
  tags: [tag('situation', 'crisis'), tag('effort', 'low')],
})
const coldWater = makeSkill({
  id: 'cold-water',
  title: 'Cold water',
  crisisPriority: 2,
  tags: [tag('situation', 'crisis'), tag('effort', 'low')],
})
const boxBreathing = makeSkill({
  id: 'box-breathing',
  title: 'Box breathing',
  tags: [tag('situation', 'emotion-regulation'), tag('effort', 'low')],
})
const walk = makeSkill({
  id: 'walk',
  title: 'Gentle walk',
  tags: [tag('situation', 'life-building'), tag('effort', 'medium')],
})

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <HomeScreen />
    </QueryClientProvider>,
  )
}

// A bottom-nav item by name.
function tab(name: string) {
  return within(screen.getByRole('navigation', { name: 'Main' })).getByRole('button', { name })
}

// A button on the page itself, not in an (always-mounted) sheet, which may
// carry a same-named item.
function pageButton(name: string) {
  const button = screen
    .getAllByRole('button', { name })
    .find((b) => !b.closest('[role="dialog"]'))
  if (!button) throw new Error(`No on-page button named ${name}`)
  return button
}

const bottomDistressButton = () => pageButton("In Distress")

// Anchor lists (situation lists and distress mode) render each card title as
// an h3, in order. The always-mounted sheets use plain text, so this only sees
// what's on screen.
function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
}

function expectSupportLinks() {
  const alliance = screen.getByRole('link', { name: /National Alliance for Eating Disorders/ })
  expect(alliance).toHaveAttribute('href', expect.stringContaining('allianceforeatingdisorders.com'))
  const lifeline = screen.getByRole('link', { name: /988 Suicide & Crisis Lifeline/ })
  expect(lifeline).toHaveAttribute('href', 'tel:988')
  // The NEDA helpline was disconnected; it must never come back.
  expect(document.body.textContent).not.toMatch(/NEDA/)
}

beforeEach(() => {
  // Deliberately out of priority order, to prove distress mode sorts.
  state.skills = [walk, coldWater, boxBreathing, grounding]
  logger.startLog.mockClear()
  logger.saveReflection.mockClear()
  creator.mutateAsync.mockReset()
  state.meta = {}
  tour.completeTour.mockReset().mockResolvedValue(undefined)
})

describe('find → open → log', () => {
  it('reaches a situation, opens an anchor, and logs a use instantly', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByLabelText('Find an anchor'))
    await user.click(screen.getByLabelText('Calm down'))

    expect(screen.getByRole('heading', { name: "Let's soften what you're feeling" })).toBeInTheDocument()
    // Only this situation's anchors are listed (cards render as h3s).
    expect(cardTitles()).toEqual(['Box breathing'])

    await user.click(screen.getByRole('heading', { level: 3, name: 'Box breathing' }))
    await user.click(screen.getByRole('button', { name: 'I used this' }))

    expect(logger.startLog).toHaveBeenCalledWith('box-breathing')
    expect(screen.getByText(/Logged/)).toBeInTheDocument()
    // Reflection is optional: Done is available without rating anything.
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(logger.saveReflection).not.toHaveBeenCalled()
  })
})

describe('distress mode', () => {
  it('is one tap from home and lists the distress set in priority order, unfiltered', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(bottomDistressButton())

    expect(screen.getByText('In distress')).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Grounding 5-4-3-2-1', 'Cold water'])
    expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument()
    expectSupportLinks()
  })

  it('opens straight to distress mode from the wheel, with no filtering step', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByLabelText('Find an anchor'))
    await user.click(screen.getByLabelText('In distress'))

    expect(cardTitles()).toEqual(['Grounding 5-4-3-2-1', 'Cold water'])
    expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument()
    expectSupportLinks()
  })

  it('still shows support links when the distress set is empty', async () => {
    state.skills = [boxBreathing, walk]
    const user = userEvent.setup()
    renderHome()

    await user.click(bottomDistressButton())

    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Choose your anchors' })).toBeInTheDocument()
    expectSupportLinks()
  })
})

describe('My Anchors', () => {
  it('is one tap from home, newest activity first, with an Add an Anchor button', async () => {
    state.skills = [
      { ...boxBreathing, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
      { ...walk, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' },
      { ...grounding, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    ]
    const user = userEvent.setup()
    renderHome()

    await user.click(tab('My Anchors'))

    expect(screen.getByRole('heading', { level: 1, name: 'My Anchors' })).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Gentle walk', 'Grounding 5-4-3-2-1', 'Box breathing'])

    await user.click(pageButton('Add an Anchor'))
    const sheet = screen.getByRole('dialog', { name: 'Add an Anchor' })
    expect(within(sheet).getByRole('heading', { name: 'Add an Anchor' })).toBeInTheDocument()
  })

  it('shows the new quick filters, in order', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('My Anchors'))

    const quick = screen
      .getAllByRole('button', { pressed: false })
      .map((b) => b.textContent)
      .filter((t) => ['Low Effort', 'Slow the spiral', 'Calm down', 'DBT'].includes(t ?? ''))
    expect(quick.slice(0, 4)).toEqual(['Low Effort', 'Slow the spiral', 'Calm down', 'DBT'])
  })

  it('marks distress-set anchors with a buoy, and only those', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('My Anchors'))

    const marked = screen
      .getAllByRole('img', { name: 'In your distress set' })
      .map((m) => m.closest('[class*="cursor-pointer"]')?.querySelector('h3')?.textContent)
    expect(marked.sort()).toEqual(['Cold water', 'Grounding 5-4-3-2-1'])
    // It's a marker, not a toggle.
    expect(screen.queryByRole('button', { name: /distress set/ })).not.toBeInTheDocument()

    // Marked cards skip the redundant Distress tag; it stays on the detail view.
    const coldWaterCard = screen.getByRole('heading', { level: 3, name: 'Cold water' }).closest('[class*="cursor-pointer"]') as HTMLElement
    expect(within(coldWaterCard).queryByText('Distress')).not.toBeInTheDocument()
    expect(within(coldWaterCard).getAllByText('Low Effort').length).toBeGreaterThan(0)
  })

  it('has no favorites anywhere', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('My Anchors'))
    expect(screen.queryByLabelText(/favorite/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('heading', { level: 3, name: 'Box breathing' }))
    expect(screen.queryByLabelText(/favorite/i)).not.toBeInTheDocument()

    await user.click(bottomDistressButton())
    expect(screen.queryByLabelText(/favorite/i)).not.toBeInTheDocument()
  })
})

describe("Today's Skill", () => {
  it('suggests only a Build balance anchor', () => {
    renderHome()
    const card = screen.getByText("Today's Skill to practice").parentElement!
    // Gentle walk is the only Build balance anchor in the fixtures.
    expect(within(card).getByText('Gentle walk')).toBeInTheDocument()
  })

  it('is hidden when there are no Build balance anchors', () => {
    state.skills = [grounding, coldWater, boxBreathing]
    renderHome()
    expect(screen.queryByText("Today's Skill to practice")).not.toBeInTheDocument()
  })
})

describe('Reflect', () => {
  it('searches anchors by title and offers a new anchor when nothing matches', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })
    const search = within(sheet).getByRole('searchbox', { name: 'Search your anchors' })

    await user.type(search, 'BREATH')
    const options = () =>
      within(sheet)
        .getAllByRole('button')
        .map((b) => b.textContent)
        .filter((t) => state.skills.some((s) => s.title === t))
    expect(options()).toEqual(['Box breathing'])

    await user.clear(search)
    await user.type(search, 'zzz')
    expect(options()).toEqual([])
    await user.click(within(sheet).getByRole('button', { name: 'I used a new anchor' }))
    // The form opens inside the log sheet, named from the search.
    expect(within(sheet).getByRole('heading', { name: 'Add the anchor you used' })).toBeInTheDocument()
    expect(within(sheet).getByRole('textbox', { name: 'Name' })).toHaveValue('zzz')
  })

  // Fills the required fields of the in-sheet new-anchor form.
  async function fillNewAnchor(user: ReturnType<typeof userEvent.setup>, sheet: HTMLElement) {
    await user.type(within(sheet).getByRole('textbox', { name: 'Name' }), 'Hum a song')
    await user.click(within(sheet).getByRole('button', { name: 'Calm down' }))
    await user.click(within(sheet).getByRole('button', { name: 'Low Effort' }))
    await user.click(within(sheet).getByRole('button', { name: 'Anywhere' }))
  }

  it('creates a new anchor and logs it against the real id, then offers a reflection', async () => {
    creator.mutateAsync.mockResolvedValue('real-skill-id')
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })

    // Reachable without searching first.
    await user.click(within(sheet).getByRole('button', { name: 'I used a new anchor' }))
    const save = within(sheet).getByRole('button', { name: 'Save and log' })
    expect(save).toBeDisabled()
    await fillNewAnchor(user, sheet)
    await user.click(save)

    expect(creator.mutateAsync).toHaveBeenCalledWith({
      title: 'Hum a song',
      description: '',
      tags: [
        { category: 'situation', label: 'emotion-regulation' },
        { category: 'effort', label: 'low' },
        { category: 'setting', label: 'anywhere' },
      ],
    })
    expect(logger.startLog).toHaveBeenCalledTimes(1)
    expect(logger.startLog).toHaveBeenCalledWith('real-skill-id')
    expect(within(sheet).getByRole('heading', { name: 'Hum a song' })).toBeInTheDocument()
    expect(within(sheet).getByText('Logged ✔️')).toBeInTheDocument()
    expect(within(sheet).getByText(/Want to add a reflection\?/)).toBeInTheDocument()

    // The reflection stays optional: Done closes without one.
    await user.click(within(sheet).getByRole('button', { name: 'Done' }))
    expect(logger.saveReflection).not.toHaveBeenCalled()
  })

  it('creates and logs nothing when the new anchor is cancelled', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })

    await user.click(within(sheet).getByRole('button', { name: 'I used a new anchor' }))
    await fillNewAnchor(user, sheet)
    await user.click(within(sheet).getByRole('button', { name: 'Cancel' }))

    // Back on the picker.
    expect(within(sheet).getByRole('heading', { name: 'Which anchor did you use?' })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Box breathing' })).toBeInTheDocument()
    expect(creator.mutateAsync).not.toHaveBeenCalled()
    expect(logger.startLog).not.toHaveBeenCalled()
  })

  it('logs nothing and stays on the form when the create fails', async () => {
    creator.mutateAsync.mockRejectedValue(new Error('network down'))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })

    await user.click(within(sheet).getByRole('button', { name: 'I used a new anchor' }))
    await fillNewAnchor(user, sheet)
    await user.click(within(sheet).getByRole('button', { name: 'Save and log' }))

    expect(await within(sheet).findByText(/couldn't save that just now/)).toBeInTheDocument()
    expect(within(sheet).getByRole('textbox', { name: 'Name' })).toHaveValue('Hum a song')
    expect(logger.startLog).not.toHaveBeenCalled()
    quiet.mockRestore()
  })

  it('clears the search', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })
    const search = within(sheet).getByRole('searchbox', { name: 'Search your anchors' })

    await user.type(search, 'walk')
    await user.click(within(sheet).getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
  })

  it('reaches past reflections from inside the sheet', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Reflect'))
    const sheet = screen.getByRole('dialog', { name: 'Log an anchor you used' })

    await user.click(within(sheet).getByRole('button', { name: 'See past reflections' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Reflections' })).toBeInTheDocument()
  })
})

describe('Add an Anchor sheet', () => {
  it('keeps Senses and Approach in a collapsed optional section', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('My Anchors'))
    await user.click(pageButton('Add an Anchor'))
    const sheet = screen.getByRole('dialog', { name: 'Add an Anchor' })

    const toggle = within(sheet).getByRole('button', { name: /Additional info/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(sheet).queryByText('Senses')).not.toBeInTheDocument()
    expect(within(sheet).getByText('Effort')).toBeInTheDocument()

    await user.click(toggle)
    expect(within(sheet).getByText('Senses')).toBeInTheDocument()
    expect(within(sheet).getByText('Approach')).toBeInTheDocument()
  })

  it('opens the optional section when editing an anchor that uses it', async () => {
    state.skills = [
      ...state.skills,
      makeSkill({
        id: 'music',
        title: 'Mindful music',
        tags: [tag('situation', 'distraction'), tag('effort', 'low'), tag('senses', 'sound')],
      }),
    ]
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('My Anchors'))
    await user.click(screen.getByRole('heading', { level: 3, name: 'Mindful music' }))
    await user.click(screen.getByRole('button', { name: 'Edit anchor' }))

    const sheet = screen.getByRole('dialog', { name: 'Edit an anchor' })
    expect(within(sheet).getByRole('button', { name: /Additional info/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(sheet).getByRole('button', { name: 'Sound', pressed: true })).toBeInTheDocument()
  })
})

describe('bottom nav', () => {
  it('has Home · My Anchors · In Distress · Reflect · Account, with Home current at home', () => {
    renderHome()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Home',
      'My Anchors',
      'In Distress',
      'Reflect',
      'Account',
    ])
    expect(tab('Home')).toHaveAttribute('aria-current', 'page')
    // No menu drawer: everything it held lives in the nav (or My Anchors).
    expect(screen.queryByRole('button', { name: 'Menu' })).not.toBeInTheDocument()
  })

  it('opens Account & data from the nav, where Sign out now lives', async () => {
    const user = userEvent.setup()
    renderHome()
    // The old header profile menu is gone; Account is only in the nav.
    expect(screen.getAllByRole('button', { name: 'Account' })).toHaveLength(1)

    await user.click(tab('Account'))
    expect(screen.getByRole('heading', { level: 1, name: 'Account & data' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    expect(tab('Account')).toHaveAttribute('aria-current', 'page')
    // The current item is highlighted (light blue), the others aren't.
    expect(tab('Account').className).toMatch(/bg-primary\/10/)
    expect(tab('Home').className).not.toMatch(/bg-primary\/10/)
  })

  it('highlights In Distress in coral when you are there', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('In Distress'))
    expect(tab('In Distress')).toHaveAttribute('aria-current', 'page')
    expect(tab('In Distress').className).toMatch(/bg-\[hsl\(10,76%,93%\)\]/)
  })
})

describe('legal pages', () => {
  it('opens the privacy policy and terms inside the app from Account, with Account still current', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(tab('Account'))

    await user.click(screen.getByRole('button', { name: 'Privacy Policy' }))
    expect(screen.getByTitle('Privacy Policy')).toHaveAttribute('src', '/privacy.html')
    expect(tab('Account')).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: /Back/ }))
    await user.click(screen.getByRole('button', { name: 'Terms of Service' }))
    expect(screen.getByTitle('Terms of Service')).toHaveAttribute('src', '/terms.html')
  })
})

describe('home tour', () => {
  const tourCard = () =>
    screen.queryAllByRole('dialog').find((d) => d.getAttribute('aria-modal') === 'false') ?? null

  it('never runs for accounts that predate it (no tour flag)', () => {
    renderHome()
    expect(tourCard()).toBeNull()
  })

  it('walks the anchor, each category, In Distress, Reflect, and My Anchors, then ends for good', async () => {
    state.meta = { toured: false }
    const user = userEvent.setup()
    renderHome()

    const titles: string[] = []
    for (;;) {
      const c = tourCard()
      if (!c) break
      titles.push(within(c).getByRole('heading').textContent ?? '')
      const next = within(c).queryByRole('button', { name: 'Next' })
      if (!next) {
        // Skip is on every step but the last, which only finishes.
        expect(within(c).queryByRole('button', { name: 'Skip tour' })).toBeNull()
        await user.click(within(c).getByRole('button', { name: 'Get started' }))
        continue
      }
      expect(within(c).getByRole('button', { name: 'Skip tour' })).toBeInTheDocument()
      await user.click(next)
    }

    expect(titles).toEqual([
      'A quick look around',
      'In distress',
      'Calm down',
      'Slow the spiral',
      'Build balance',
      'Always one tap away',
      'Reflect when you like',
      'All your anchors',
      "You're ready",
    ])
    expect(tour.completeTour).toHaveBeenCalledTimes(1)
  })

  it('spotlights the category it is describing', async () => {
    state.meta = { toured: false }
    const user = userEvent.setup()
    renderHome()
    // Tapping the anchor itself moves the tour on, opening the wheel.
    await user.click(screen.getByLabelText('Find an anchor'))
    expect(within(tourCard()!).getByRole('heading')).toHaveTextContent('In distress')
    const wedge = (label: string) => document.querySelector(`path[aria-label="${label}"]`)
    expect(wedge('In distress')).toHaveAttribute('opacity', '1')
    expect(wedge('Calm down')).toHaveAttribute('opacity', '0.35')
  })

  it('ends immediately on Skip tour', async () => {
    state.meta = { toured: false }
    const user = userEvent.setup()
    renderHome()
    await user.click(within(tourCard()!).getByRole('button', { name: 'Skip tour' }))
    expect(tourCard()).toBeNull()
    expect(tour.completeTour).toHaveBeenCalledTimes(1)
  })

  it('holds home still mid-tour, except In Distress', async () => {
    state.meta = { toured: false }
    const user = userEvent.setup()
    renderHome()
    for (const name of ['Home', 'My Anchors', 'Reflect', 'Account']) {
      expect(tab(name)).toBeDisabled()
    }
    expect(bottomDistressButton()).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Anchor — go home' })).toBeDisabled()

    // The buoy itself is the one live control on the first step…
    await user.click(screen.getByLabelText('Find an anchor'))
    expect(within(tourCard()!).getByRole('heading')).toHaveTextContent('In distress')
    // …after that the wheel holds still: no leaving via a category.
    const wedge = document.querySelector('path[aria-label="Calm down"]')!
    await user.click(wedge)
    expect(within(tourCard()!).getByRole('heading')).toHaveTextContent('In distress')
    expect(screen.queryByRole('heading', { level: 1, name: "Let's soften what you're feeling" })).toBeNull()
  })

  it('never blocks distress mode: In Distress pauses the tour, which resumes back home', async () => {
    state.meta = { toured: false }
    const user = userEvent.setup()
    renderHome()
    await user.click(within(tourCard()!).getByRole('button', { name: 'Next' }))
    await user.click(within(tourCard()!).getByRole('button', { name: 'Next' }))
    expect(within(tourCard()!).getByRole('heading')).toHaveTextContent('Calm down')

    await user.click(bottomDistressButton())
    expect(screen.getByRole('heading', { level: 1, name: "Let's just get steady" })).toBeInTheDocument()
    expectSupportLinks()
    expect(tourCard()).toBeNull()
    expect(tour.completeTour).not.toHaveBeenCalled()

    // Off home, the nav is fully live; Home brings the tour back where it was.
    await user.click(tab('Home'))
    expect(within(tourCard()!).getByRole('heading')).toHaveTextContent('Calm down')
    expect(document.querySelector('path[aria-label="Calm down"]')).toHaveAttribute('opacity', '1')
  })
})
