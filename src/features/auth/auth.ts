import type { User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// Thin wrappers around supabase.auth. The whole app's authentication surface
// lives here so the rest of the UI never touches the SDK directly.

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  // Email confirmation is OFF, so a session comes back immediately and the
  // auth listener signs the user straight in. If confirmation is ever turned
  // on, there's no session yet — surface a gentle "check your email" instead.
  return { needsConfirmation: !data.session }
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    // Come back to wherever the app is running (localhost in dev, the deployed
    // origin in prod). The redirect URL must also be allow-listed in the
    // Supabase dashboard → Authentication → URL Configuration.
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
  // The browser is now navigating to Google; the AuthProvider picks up the
  // session when it lands back here.
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Whether this account can set a password — i.e. it has an email/password
// identity. Google-only accounts don't, so the change-password UI is hidden for
// them (their password lives with Google).
export function hasPasswordLogin(user: User | null): boolean {
  const identities = user?.identities ?? []
  if (identities.length > 0) {
    return identities.some((i) => i.provider === 'email')
  }
  // Fallback when identities aren't populated on the session user.
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? []
  return providers.includes('email') || user?.app_metadata?.provider === 'email'
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

// Whether this user has been through first-run onboarding. Stored as a flag in
// auth user_metadata — it's a UI gate (not authorization), it rides along on the
// session so the app can decide without an extra query, and it needs no schema.
export function isOnboarded(user: User | null): boolean {
  return user?.user_metadata?.onboarded === true
}

// Mark onboarding complete, saving the chosen name alongside the flag. updateUser
// merges into user_metadata, so any existing fields (e.g. a Google profile name)
// are preserved. Firing this updates the session, which flips the app from the
// onboarding flow to the home screen.
export async function completeOnboarding(fullName: string) {
  const data: Record<string, unknown> = { onboarded: true }
  const name = fullName.trim()
  if (name) data.full_name = name
  const { error } = await supabase.auth.updateUser({ data })
  if (error) throw error
}

// Permanently delete the signed-in user's account and all their data. The
// security-definer delete_own_account() RPC removes the auth.users row, which
// cascade-deletes their skills and reflections (see the migration). We then
// clear the now-invalid local session so the app returns to the sign-in screen.
export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
  await supabase.auth.signOut({ scope: 'local' })
}
