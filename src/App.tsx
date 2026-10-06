import { useState } from 'react'
import { Anchor } from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { useAuth } from '@/features/auth/AuthProvider'
import { isOnboarded } from '@/features/auth/auth'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { HomeScreen } from '@/features/skills/HomeScreen'
import { LandingScreen } from '@/features/landing/LandingScreen'

// The installed app (home-screen PWA) belongs to someone who already chose
// Anchor, so it skips the public landing page and opens straight to sign-in.
const isInstalledApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export default function App() {
  const { session, user, loading } = useAuth()
  // Signed out: the landing page, until they pick sign-in or sign-up.
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null)

  // Hold on a calm splash while we restore any existing session, so we never
  // flash the auth screen at someone who's already signed in.
  if (loading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center">
        <OceanBackdrop />
        <span className="animate-breathe flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Anchor className="size-8" />
        </span>
      </div>
    )
  }

  if (!session) {
    if (isInstalledApp()) return <AuthScreen />
    if (authMode === null) {
      return (
        <LandingScreen
          onSignIn={() => setAuthMode('signin')}
          onSignUp={() => setAuthMode('signup')}
        />
      )
    }
    return (
      <AuthScreen
        key={authMode}
        initialMode={authMode}
        onBack={() => setAuthMode(null)}
      />
    )
  }
  // New accounts go through first-run onboarding once (flag in user_metadata).
  // In dev, `?onboarding` replays it on any account for review.
  const previewOnboarding =
    import.meta.env.DEV && new URLSearchParams(window.location.search).has('onboarding')
  if (!isOnboarded(user) || previewOnboarding) return <OnboardingFlow />
  return <HomeScreen />
}
