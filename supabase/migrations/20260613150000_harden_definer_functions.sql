-- Security hardening from `supabase db advisors` (all WARN, no ERRORs).
--
-- 1. delete_own_account(): meant only for signed-in users acting on themselves.
--    Supabase's default privileges auto-grant EXECUTE to `anon` on new public
--    functions, so the original `revoke from public` didn't stop anon. Revoke it
--    explicitly. (EXECUTE for `authenticated` stays — that IS the feature.)
revoke all on function public.delete_own_account() from anon;

-- 2. handle_new_user(): a trigger function that should never be reachable as an
--    RPC. Revoke from every API role; the signup trigger still fires (triggers
--    don't require the calling user to hold EXECUTE).
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 3. set_updated_at(): pin a non-mutable search_path (advisor lint 0011).
alter function public.set_updated_at() set search_path = '';
