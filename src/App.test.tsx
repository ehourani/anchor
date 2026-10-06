import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from './App'

// The signed-out front door: landing page → sign in / sign up, and back.
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ session: null, user: null, loading: false }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('signed out', () => {
  it('opens on the landing page: what Anchor is, the way in, support, and the legal links', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Anchor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()

    // Google brand verification needs the privacy policy linked from the homepage.
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')

    // Support is reachable before anyone has an account.
    expect(screen.getByRole('link', { name: /National Alliance for Eating Disorders/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /988 Suicide & Crisis Lifeline/ })).toHaveAttribute('href', 'tel:988')
    expect(document.body.textContent).not.toMatch(/NEDA/)
  })

  it('goes to sign-up or sign-in, and Back returns to the landing page', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    expect(screen.getByRole('heading', { name: 'Create your space' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Anchor' })).toBeInTheDocument()
  })

  it('opens the installed app straight to sign-in, with no landing page', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(display-mode: standalone)' }))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
  })
})
