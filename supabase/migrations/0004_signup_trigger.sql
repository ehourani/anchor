-- 0004_signup_trigger.sql
-- On signup, seed a per-user set of default coping skills (with tags and crisis
-- priorities) so a brand-new account has a working crisis mode immediately
-- (PROJECT.md §7). The master list of starter skills lives INSIDE this function —
-- there is no template table.
--
-- Security notes:
--   * SECURITY DEFINER: the function runs as its owner so it can write the new
--     user's rows past RLS. It only ever writes rows keyed to new.id, so it cannot
--     touch another user's data.
--   * set search_path = '': hardens against search-path hijacking, so every object
--     below is schema-qualified (public.*, auth.users).
--   * No EXECUTE revoke is needed: a function returning `trigger` cannot be called
--     directly ("trigger functions can only be called as triggers"), so it is not a
--     reachable RPC even though it lives in the public schema.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $func$
declare
  v_skill_id uuid;
begin
  -- 1. Reach out to someone safe
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default)
  values (new.id,
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
  values (new.id,
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
  values (new.id,
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
  values (new.id,
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
  values (new.id,
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
  values (new.id,
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

  return new;
end;
$func$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
