import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { makeSkill, tag } from '@/test/fixtures'
import { OnboardingFlow } from './OnboardingFlow'

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1', user_metadata: {} }, session: {}, loading: false }),
}))
vi.mock('@/features/auth/auth', () => ({ completeOnboarding: vi.fn() }))
vi.mock('@/features/skills/useSkills', () => ({
  skillsQueryKey: (userId: string | undefined) => ['skills', userId],
  useSkills: () => ({
    // No distress set yet, to check that step's empty state.
    data: [makeSkill({ title: 'Box breathing', tags: [tag('situation', 'emotion-regulation')] })],
  }),
}))

function renderFlow() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <OnboardingFlow />
    </QueryClientProvider>,
  )
}

describe('OnboardingFlow', () => {
  it('goes welcome → name → what is Anchor → anchors → distress set', async () => {
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

    expect(screen.getByRole('heading', { name: 'What is Anchor?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { name: 'Add a few anchors' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Your distress anchors' })).toBeInTheDocument()
    expect(screen.getByText(/No distress anchors yet, and that's okay/)).toBeInTheDocument()
  })
})
