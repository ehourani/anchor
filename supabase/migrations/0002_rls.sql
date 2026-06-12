-- 0002_rls.sql
-- Row-Level Security for Anchor. RLS is THE security boundary (PROJECT.md §7):
-- the browser talks to Postgres with the public anon key, so access MUST be gated
-- in the database, not in app code. A user-owned table with RLS off plus the anon
-- key is a full data exposure.
--
-- Conventions (Supabase RLS best practices):
--   * Wrap auth.uid() as (select auth.uid()) so it is evaluated once per query
--     (cached in an initplan) instead of once per row.
--   * Scope every policy `to authenticated`; the app is fully auth-gated, so the
--     anon role is intentionally granted nothing.
--   * One policy per operation, for least-privilege clarity.
--   * Policy columns (skills.user_id, usage_logs.user_id, skill_tags.skill_id) are
--     already indexed in 0001.

-- ---------------------------------------------------------------------------
-- skills — each row belongs to exactly one user.
-- ---------------------------------------------------------------------------
alter table skills enable row level security;

create policy "skills - select own" on skills
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "skills - insert own" on skills
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "skills - update own" on skills
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "skills - delete own" on skills
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- usage_logs — each row belongs to exactly one user (same pattern as skills).
-- ---------------------------------------------------------------------------
alter table usage_logs enable row level security;

create policy "usage_logs - select own" on usage_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "usage_logs - insert own" on usage_logs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "usage_logs - update own" on usage_logs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "usage_logs - delete own" on usage_logs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- skill_tags — join table with no user_id; ownership flows from the parent skill.
-- A user may only attach/detach tags on skills they own. Tags themselves are global.
-- No UPDATE policy by design: both columns form the primary key, so rows are added
-- or removed, never updated — UPDATE is therefore denied.
-- ---------------------------------------------------------------------------
alter table skill_tags enable row level security;

create policy "skill_tags - select own" on skill_tags
  for select to authenticated
  using (
    exists (
      select 1 from skills
      where skills.id = skill_tags.skill_id
        and skills.user_id = (select auth.uid())
    )
  );

create policy "skill_tags - insert own" on skill_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from skills
      where skills.id = skill_tags.skill_id
        and skills.user_id = (select auth.uid())
    )
  );

create policy "skill_tags - delete own" on skill_tags
  for delete to authenticated
  using (
    exists (
      select 1 from skills
      where skills.id = skill_tags.skill_id
        and skills.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- tag_categories & tags — global, seeded, read-only vocabulary.
-- Readable by any signed-in user; writable by NO ONE through the API. Writes
-- happen only via migrations / seed.sql, which run as the table owner and bypass
-- RLS. We also revoke the default write grants for defense in depth, so even a
-- future stray policy cannot open these tables to client writes.
-- ---------------------------------------------------------------------------
alter table tag_categories enable row level security;
alter table tags enable row level security;

create policy "tag_categories - read all" on tag_categories
  for select to authenticated
  using (true);

create policy "tags - read all" on tags
  for select to authenticated
  using (true);

revoke insert, update, delete on tag_categories from anon, authenticated;
revoke insert, update, delete on tags from anon, authenticated;
