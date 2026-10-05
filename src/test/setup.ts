import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'

// Tests never talk to Supabase. Any code path that reaches the real client
// throws, and is also recorded so the test fails even when app code catches
// the error (fire-and-forget writes do). Tests mock the data hooks instead.
const supabaseAccesses = vi.hoisted(() => [] as string[])

vi.mock('@/lib/supabase', () => ({
  supabase: new Proxy(
    {},
    {
      get(_target, prop) {
        supabaseAccesses.push(String(prop))
        throw new Error(
          `Tests must not use the Supabase client (accessed supabase.${String(prop)}). Mock the data hook instead.`,
        )
      },
    },
  ),
}))

afterEach(() => {
  cleanup()
  const accessed = supabaseAccesses.splice(0)
  expect(accessed, 'test reached the Supabase client').toEqual([])
})
