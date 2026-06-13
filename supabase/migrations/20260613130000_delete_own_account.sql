-- Lets a signed-in user permanently delete their own account.
--
-- Deleting the auth.users row cascades to all of the user's data — their skills
-- (and skill_tags) and usage_logs all carry `on delete cascade` foreign keys to
-- auth.users (see 0001) — so this single delete removes everything they own.
--
-- It runs as `security definer` because only a privileged role may touch
-- auth.users, but it can only ever delete the *calling* user: the WHERE is fixed
-- to auth.uid(), so a client can't pass an id and remove anyone else. EXECUTE is
-- granted to `authenticated` only. This keeps account deletion fully self-serve
-- without putting a service-role key in the frontend.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
