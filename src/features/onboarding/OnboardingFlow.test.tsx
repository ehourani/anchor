import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { makeSkill, tag } from '@/test/fixtures'
import type { Skill } from '@/features/skills/sampleSkills'
import { OnboardingFlow } from './OnboardingFlow'

const state = vi.hoisted(() => ({ skills: [] as Skill[] }))
const deleteSkill = vi.hoisted(() => vi.fn())

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1', user_metadata: {} }, session: {}, loading: false }),
}))
vi.mock('@/features/auth/auth', () => ({ completeOnboarding: vi.fn() }))
vi.mock('@/features/skills/useSkills', () => ({
  skillsQueryKey: (userId: string | undefined) => ['skills', userId],
  useSkills: () => ({ data: state.skills }),
}))
vi.mock('@/features/skills/useDeleteSkill', () => ({
  // Mirror the optimistic delete: drop it from the list right away.
  useDeleteSkill: () => ({
    mutate: (id: string) => {
      deleteSkill(id)
      state.skills = state.skills.filter((s) => s.id !== id)
    },
  }),
}))

// Six seeded defaults (seed order = createdAt) plus one the user added.
const defaults = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((title, i) =>
  makeSkill({
    id: `default-${i + 1}`,
    title: `Default ${title}`,
    description: `How to do default ${title.toLowerCase()}.`,
    isDefault: true,
    createdAt: `2026-01-01T00:00:0${i}Z`,
    tags: [tag('situation', 'emotion-regulation')],
  }),
)
const own = makeSkill({
  id: 'own',
  title: 'My own anchor',
  description: 'Something that helps me.',
  isDefault: false,
})

function renderFlow() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <OnboardingFlow />
    </QueryClientProvider>,
  )
}

async function goToStarters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Get started' }))
  await user.type(screen.getByLabelText('First name'), 'Sam')
  await user.type(screen.getByLabelText('Last name'), 'Rivera')
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  // The greeting moves on by itself after a moment.
  await screen.findByRole('heading', { name: 'Anchors are your coping skills' }, { timeout: 3000 })
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

const starterTitles = () =>
  screen
    .getAllByRole('button', { name: /^About / })
    .map((b) => b.getAttribute('aria-label')!.replace(/^About /, ''))

beforeEach(() => {
  state.skills = [...defaults, own]
  deleteSkill.mockClear()
})

describe('OnboardingFlow', () => {
  it('goes welcome → name → anchors → distress anchors → starters → distress set', async () => {
    state.skills = [own] // no distress set yet, to check that step's empty state
    const user = userEvent.setup()
    renderFlow()

    await user.click(screen.getByRole('button', { name: 'Get started' }))

    // Both names are required before Continue unlocks.
    const next = screen.getByRole('button', { name: 'Continue' })
    expect(next).toBeDisabled()
    await user.type(screen.getByLabelText('First name'), 'Sam')
    expect(next).toBeDisabled()
    await user.type(screen.getByLabelText('Last name'), 'Rivera')
    await user.click(next)

    // A brief "Nice to meet you", then on to the explainer by itself.
    expect(screen.getByText('Nice to meet you, Sam.')).toBeInTheDocument()
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Anchors are your coping skills' },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      screen.getByRole('heading', { name: 'Distress anchors are for the hardest moments' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      screen.getByRole('heading', { name: "We'll start you off with a few anchors" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Your distress anchors' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/No distress anchors yet, and that's okay/)).toBeInTheDocument()
  })

  it('shows exactly 4 starter defaults, plus anchors the user added', async () => {
    const user = userEvent.setup()
    renderFlow()
    await goToStarters(user)

    expect(starterTitles()).toEqual([
      'Default One',
      'Default Two',
      'Default Three',
      'Default Four',
      'My own anchor',
    ])
  })

  it('(i) shows the description, read-only', async () => {
    const user = userEvent.setup()
    renderFlow()
    await goToStarters(user)

    expect(screen.queryByText('How to do default two.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'About Default Two' }))
    // Plain text, not an editable field.
    expect(screen.getByText('How to do default two.').tagName).toBe('P')
  })

  it('only anchors the user added can be removed; the starters stay', async () => {
    const user = userEvent.setup()
    const { rerender } = renderFlow()
    await goToStarters(user)

    expect(screen.queryByRole('button', { name: /^Remove Default/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove My own anchor' }))
    expect(deleteSkill).toHaveBeenCalledWith('own')
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <OnboardingFlow />
      </QueryClientProvider>,
    )

    expect(starterTitles()).toEqual([
      'Default One',
      'Default Two',
      'Default Three',
      'Default Four',
    ])
  })
})
