import { useState, type FormEvent } from 'react'
import { Anchor } from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from './auth'

type Mode = 'signin' | 'signup'

const fieldClass =
  'w-full rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-[0.95rem] text-foreground placeholder:text-foreground/35 shadow-sm backdrop-blur-sm transition-colors focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30'

// The Google "G", inline so we don't pull in another icon dependency.
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isSignup = mode === 'signup'

  const toggleMode = () => {
    setMode(isSignup ? 'signin' : 'signup')
    setError(null)
    setNotice(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUpWithEmail(email, password)
        // With confirmation off this won't fire — but keep a gentle fallback.
        if (needsConfirmation) {
          setNotice('Almost there — check your email to confirm your account.')
        }
      } else {
        await signInWithEmail(email, password)
      }
      // On success the auth listener swaps this screen for the home screen;
      // no navigation needed here.
    } catch (err) {
      setError(messageFor(err))
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    if (busy) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      // The browser is redirecting to Google now.
    } catch (err) {
      setError(messageFor(err))
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10">
      <OceanBackdrop />

      <div className="animate-fade-rise w-full max-w-sm">
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Anchor className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            {isSignup ? 'Create your space' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-foreground/60">
            {isSignup
              ? 'A calm, private home for your coping skills.'
              : 'Your toolkit is right where you left it.'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-[0_20px_50px_-20px_hsl(200_50%_40%_/_0.35)] backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground/70"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
                className={fieldClass}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full rounded-xl bg-primary py-3 text-[0.95rem] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy
                ? 'One moment…'
                : isSignup
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-xs text-foreground/40">
            <span className="h-px flex-1 bg-foreground/10" />
            or
            <span className="h-px flex-1 bg-foreground/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/70 bg-white/80 py-3 text-[0.95rem] font-semibold text-foreground shadow-sm transition-colors hover:bg-white disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        {/* Mode toggle */}
        <p className="mt-6 text-center text-sm text-foreground/60">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}

// Soften the SDK's error wording into something gentle and plain.
function messageFor(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (/invalid login credentials/i.test(raw)) {
    return "That email and password don't match. Want to try again?"
  }
  if (/already registered|already exists/i.test(raw)) {
    return 'There’s already an account with this email — try signing in.'
  }
  if (/password should be at least/i.test(raw)) {
    return 'Please choose a password with at least 6 characters.'
  }
  return raw || 'Something went wrong. Please try again.'
}
