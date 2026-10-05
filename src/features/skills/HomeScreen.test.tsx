import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { makeSkill, tag } from '@/test/fixtures'
import type { Skill } from './sampleSkills'
import { HomeScreen } from './HomeScreen'

// Core-loop tests over the real HomeScreen. Data hooks are mocked with
// fixtures; the Supabase client itself is a throwing guard (src/test/setup.ts).
const state = vi.hoisted(() => ({ skills: [] as Skill[] }))
const logger = vi.hoisted(() => ({ startLog: vi.fn(), saveReflection: vi.fn() }))

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'sam@example.com', user_metadata: { full_name: 'Sam Rivera' } },
    session: {},
    loading: false,
  }),
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

// The bottom-bar distress button (the menu drawer has one too).
function bottomDistressButton() {
  const button = screen
    .getAllByRole('button', { name: "I'm in distress" })
    .find((b) => !b.closest('[role="dialog"]'))
  if (!button) throw new Error('No bottom-bar distress button')
  return button
}

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

  it('is reachable from the menu drawer', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Menu' })
    await user.click(within(drawer).getByRole('button', { name: "I'm in distress" }))

    expect(cardTitles()).toEqual(['Grounding 5-4-3-2-1', 'Cold water'])
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
