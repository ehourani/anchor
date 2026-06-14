import { Anchor } from 'lucide-react'

import { OceanBackdrop } from '@/components/OceanBackdrop'
import { useAuth } from '@/features/auth/AuthProvider'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { HomeScreen } from '@/features/skills/HomeScreen'

export default function App() {
  const { session, loading } = useAuth()

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

  return session ? <HomeScreen /> : <AuthScreen />
}
