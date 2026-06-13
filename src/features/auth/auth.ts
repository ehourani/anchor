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
