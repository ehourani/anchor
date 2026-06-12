-- 0005_backfill_default_skills.sql
-- Two goals:
--   1. Refactor the starter-skill seeding out of the trigger into a single reusable
--      function, public.seed_default_skills(uuid), so there is ONE master list used
--      by both the signup trigger and the backfill below.
--   2. Backfill any existing user who has no skills yet (e.g. accounts created before
--      the 0004 trigger existed), so they get a working crisis set too.

-- The shared seeder. SECURITY DEFINER so it can write past RLS; search_path = ''
-- so every reference is schema-qualified. It writes only rows keyed to p_user_id.
create or replace function public.seed_default_skills(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $func$
declare
  v_skill_id uuid;
begin
  -- 1. Reach out to someone safe
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    'Reach out to someone safe',
    'Text or call someone you trust and let them know how you''re feeling. You don''t need the words ready — "I''m having a hard time" is enough.',
    true, 1, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('modality', 'dbt')
  );

  -- 2. Cold water reset
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    'Cold water reset',
    'Splash cold water on your face, or hold something cold for about 30 seconds. The cold helps your body settle when emotions spike.',
    true, 2, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'distraction'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'touch'),
    ('modality', 'dbt')
  );

  -- 3. 5-4-3-2-1 grounding
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    '5-4-3-2-1 grounding',
    'Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. It gently brings you back to the present.',
    true, 3, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('senses', 'sight'),
    ('senses', 'sound'),
    ('senses', 'touch'),
    ('modality', 'mindfulness')
  );

  -- 4. Slow paced breathing
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    'Slow paced breathing',
    'Breathe in for 4, out for 6. Keep the exhale longer than the inhale for a minute or two — it signals your nervous system that you''re safe.',
    true, 4, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('modality', 'dbt')
  );

  -- 5. Ride out the urge
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    'Ride out the urge',
    'Urges rise, crest, and fall like a wave. Set a timer for 10 minutes and let it pass without acting on it — notice it soften.',
    true, 5, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'emotion-regulation'),
    ('effort', 'medium'),
    ('setting', 'anywhere'),
    ('modality', 'mindfulness')
  );

  -- 6. Step outside for a short walk (a gentle baseline skill — not in the crisis set)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (p_user_id,
    'Step outside for a short walk',
    'Get up and move, even just around the block. A change of scenery and a little movement can loosen a stuck moment.',
    false, null, true)
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'life-building'),
    ('effort', 'medium'),
    ('setting', 'outdoors'),
    ('senses', 'movement')
  );
end;
$func$;

-- Not safe to expose: it would let any caller seed rows for an arbitrary user_id.
revoke execute on function public.seed_default_skills(uuid) from public, anon, authenticated;

-- Redefine the signup trigger function to delegate to the shared seeder.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $func$
begin
  perform public.seed_default_skills(new.id);
  return new;
end;
$func$;

-- Backfill: seed every existing user who has no skills yet. Idempotent — users who
-- already have any skills (including the trigger-seeded test account) are skipped.
do $backfill$
declare
  r record;
  n int := 0;
begin
  for r in
    select u.id
    from auth.users u
    where not exists (select 1 from public.skills s where s.user_id = u.id)
  loop
    perform public.seed_default_skills(r.id);
    n := n + 1;
  end loop;
  raise notice 'Anchor backfill: seeded default skills for % user(s) with no prior skills.', n;
end;
$backfill$;
