-- ANC-15: expand the default anchor set (6 → 21) and backfill existing users.
--
-- 1. public.seed_default_skills(uuid) is again the ONE master list (as set up
--    in 0005). 20261005120000 had inlined a copy into handle_new_user; that is
--    undone here and the trigger delegates to the seeder again.
--    Seed order matters: each row gets its own clock_timestamp(), and the
--    onboarding starter step shows the first 4 defaults by created_at — the
--    four distress anchors (5-4-3-2-1, Cold water reset, Reach out, Slow paced
--    breathing). New anchors are not in the distress set.
-- 2. Backfill: every existing user gets each NEW default they don't already
--    have. "Already have" matches on title (case-insensitive, trimmed) and
--    ignores is_default, so anyone who created an anchor with the same title
--    (e.g. the source library on the owner's account) isn't given a duplicate.
--    Safe to re-run. Existing anchors, logs, and distress sets are untouched.
--
-- Not added (duplicates of existing defaults): "Step out for a short walk"
-- (= "Step outside for a short walk") and "Wash face in cold water"
-- (≈ "Cold water reset").

create or replace function public.seed_default_skills(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $func$
declare
  v_skill_id uuid;
begin
  -- 1. 5-4-3-2-1 grounding (distress set #1)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    '5-4-3-2-1 grounding',
    'Name 5 things you can see, 4 you can hear, 3 you can touch, 2 you can smell, 1 you can taste. It gently brings you back to the present.',
    true, 1, true, clock_timestamp(), clock_timestamp())
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

  -- 2. Cold water reset (distress set #2)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Cold water reset',
    'Splash cold water on your face, or hold something cold for about 30 seconds. The cold helps your body settle when emotions spike.',
    true, 2, true, clock_timestamp(), clock_timestamp())
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

  -- 3. Reach out to someone safe (distress set #3)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Reach out to someone safe',
    'Text or call someone you trust and let them know how you''re feeling. You don''t need the words ready — "I''m having a hard time" is enough.',
    true, 3, true, clock_timestamp(), clock_timestamp())
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

  -- 4. Slow paced breathing (distress set #4)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Slow paced breathing',
    'Breathe in for 4, out for 6. Keep the exhale longer than the inhale for a minute or two — it signals your nervous system that you''re safe.',
    true, 4, true, clock_timestamp(), clock_timestamp())
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
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Ride out the urge',
    'Urges rise, crest, and fall like a wave. Set a timer for 10 minutes and let it pass without acting on it — notice it soften.',
    true, null, true, clock_timestamp(), clock_timestamp())
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

  -- 6. Step outside for a short walk
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Step outside for a short walk',
    'Get up and move, even just around the block. A change of scenery and a little movement can loosen a stuck moment.',
    false, null, true, clock_timestamp(), clock_timestamp())
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

  -- 7. Light a candle and watch the flame + smell scent
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Light a candle and watch the flame + smell scent',
    'Light a candle and watch the flame move while you breathe in its scent.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'sight'),
    ('senses', 'smell'),
    ('modality', 'mindfulness')
  );

  -- 8. Send a nice text to someone in your life
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Send a nice text to someone in your life',
    'Send one warm message to someone — a memory, a thank-you, or just "thinking of you." You don''t need the perfect words.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'life-building'),
    ('effort', 'low'),
    ('setting', 'anywhere')
  );

  -- 9. Remember a happy memory
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Remember a happy memory',
    'Bring up a happy or funny memory in detail and relive it: where you were, who was there, what made you laugh. Consider texting whoever was involved reminding them of the memory and bringing a smile to their face.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere')
  );

  -- 10. Candle breathing (friction hands, then blow)
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Candle breathing (friction hands, then blow)',
    'Rub your palms together to build warmth, then slowly blow across them as if cooling a candle, drawing the breath out long.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('senses', 'touch')
  );

  -- 11. Hold ice in hand or mouth
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Hold ice in hand or mouth',
    'Hold an ice cube in your hand or mouth, staying with the sharp cold until it fades.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'touch'),
    ('modality', 'dbt')
  );

  -- 12. Big 3 + 1
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Big 3 + 1',
    'Use the RO-DBT Big Three + One to switch on social-safety: gentle eyebrow raises, a warm closed-mouth smile, and an open, leaning-back posture — plus one slow, deep breath. It signals safety to your body and softens a guarded state.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('modality', 'rodbt')
  );

  -- 13. Box breathing
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Box breathing',
    'Breathe in a square: in for four, hold for four, out for four, hold for four. Repeat for a few rounds.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere')
  );

  -- 14. Look out the window
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Look out the window',
    'Rest your eyes on whatever''s outside — the sky, a tree, people passing, the light. Watch for a minute or two without needing it to be interesting.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('setting', 'work-or-school'),
    ('senses', 'sight'),
    ('modality', 'mindfulness')
  );

  -- 15. Mindful music-listening
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Mindful music-listening',
    'Put on a song and listen closely to the instrumental — pick out one instrument at a time: the bass, a drum, a voice underneath.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'anywhere'),
    ('senses', 'sound'),
    ('modality', 'mindfulness')
  );

  -- 16. Squeeze couch cushion + blanket
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Squeeze couch cushion + blanket',
    'Grab a cushion or wrap up in a blanket and squeeze, feeling the pressure and texture.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'crisis'),
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'touch')
  );

  -- 17. Read a book
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Read a book',
    'Pick up a book and read a few pages, letting yourself drop into the story.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'distraction'),
    ('situation', 'life-building'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'sight')
  );

  -- 18. STOP skill
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'STOP skill',
    'Stop where you are. Take a step back and breathe. Observe what''s happening inside you and around you. Then proceed mindfully, choosing what will actually help.',
    false, null, true, clock_timestamp(), clock_timestamp())
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

  -- 19. Opposite action
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Opposite action',
    'Notice what the feeling is urging you to do, and gently do the opposite. If it says hide, reach out; if it says rush, slow down. Start small.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'emotion-regulation'),
    ('effort', 'medium'),
    ('setting', 'anywhere'),
    ('modality', 'dbt')
  );

  -- 20. Check the facts
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Check the facts',
    'Ask what actually happened, apart from the story your mind is telling. Does the size of the feeling fit the facts? Noticing the gap can soften it.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'emotion-regulation'),
    ('effort', 'medium'),
    ('setting', 'anywhere'),
    ('modality', 'dbt')
  );

  -- 21. Self-soothe with your senses
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  values (p_user_id,
    'Self-soothe with your senses',
    'Comfort yourself through your senses: something soft to hold, a calming scent, music you love, or something gentle to look at.',
    false, null, true, clock_timestamp(), clock_timestamp())
  returning id into v_skill_id;

  insert into public.skill_tags (skill_id, tag_id)
  select v_skill_id, t.id from public.tags t
  where (t.tag_category, t.slug) in (
    ('situation', 'emotion-regulation'),
    ('effort', 'low'),
    ('setting', 'home'),
    ('senses', 'sight'),
    ('senses', 'sound'),
    ('senses', 'smell'),
    ('senses', 'touch'),
    ('modality', 'dbt')
  );
end;
$func$;

-- Not safe to expose: it would let any caller seed rows for an arbitrary user.
revoke all on function public.seed_default_skills(uuid) from public, anon, authenticated;

-- The signup trigger delegates to the master list again.
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

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill the new defaults for existing users, in seed order.
-- Light a candle and watch the flame + smell scent
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Light a candle and watch the flame + smell scent',
    'Light a candle and watch the flame move while you breathe in its scent.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Light a candle and watch the flame + smell scent'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('senses', 'sight'),
  ('senses', 'smell'),
  ('modality', 'mindfulness')
);

-- Send a nice text to someone in your life
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Send a nice text to someone in your life',
    'Send one warm message to someone — a memory, a thank-you, or just "thinking of you." You don''t need the perfect words.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Send a nice text to someone in your life'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'distraction'),
  ('situation', 'life-building'),
  ('effort', 'low'),
  ('setting', 'anywhere')
);

-- Remember a happy memory
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Remember a happy memory',
    'Bring up a happy or funny memory in detail and relive it: where you were, who was there, what made you laugh. Consider texting whoever was involved reminding them of the memory and bringing a smile to their face.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Remember a happy memory'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'distraction'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere')
);

-- Candle breathing (friction hands, then blow)
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Candle breathing (friction hands, then blow)',
    'Rub your palms together to build warmth, then slowly blow across them as if cooling a candle, drawing the breath out long.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Candle breathing (friction hands, then blow)'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'crisis'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere'),
  ('senses', 'touch')
);

-- Hold ice in hand or mouth
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Hold ice in hand or mouth',
    'Hold an ice cube in your hand or mouth, staying with the sharp cold until it fades.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Hold ice in hand or mouth'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'crisis'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('senses', 'touch'),
  ('modality', 'dbt')
);

-- Big 3 + 1
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Big 3 + 1',
    'Use the RO-DBT Big Three + One to switch on social-safety: gentle eyebrow raises, a warm closed-mouth smile, and an open, leaning-back posture — plus one slow, deep breath. It signals safety to your body and softens a guarded state.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Big 3 + 1'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere'),
  ('modality', 'rodbt')
);

-- Box breathing
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Box breathing',
    'Breathe in a square: in for four, hold for four, out for four, hold for four. Repeat for a few rounds.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Box breathing'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'crisis'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere')
);

-- Look out the window
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Look out the window',
    'Rest your eyes on whatever''s outside — the sky, a tree, people passing, the light. Watch for a minute or two without needing it to be interesting.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Look out the window'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'distraction'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('setting', 'work-or-school'),
  ('senses', 'sight'),
  ('modality', 'mindfulness')
);

-- Mindful music-listening
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Mindful music-listening',
    'Put on a song and listen closely to the instrumental — pick out one instrument at a time: the bass, a drum, a voice underneath.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Mindful music-listening'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'distraction'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere'),
  ('senses', 'sound'),
  ('modality', 'mindfulness')
);

-- Squeeze couch cushion + blanket
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Squeeze couch cushion + blanket',
    'Grab a cushion or wrap up in a blanket and squeeze, feeling the pressure and texture.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Squeeze couch cushion + blanket'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'crisis'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('senses', 'touch')
);

-- Read a book
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Read a book',
    'Pick up a book and read a few pages, letting yourself drop into the story.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Read a book'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'distraction'),
  ('situation', 'life-building'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('senses', 'sight')
);

-- STOP skill
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'STOP skill',
    'Stop where you are. Take a step back and breathe. Observe what''s happening inside you and around you. Then proceed mindfully, choosing what will actually help.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('STOP skill'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'crisis'),
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'anywhere'),
  ('modality', 'dbt')
);

-- Opposite action
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Opposite action',
    'Notice what the feeling is urging you to do, and gently do the opposite. If it says hide, reach out; if it says rush, slow down. Start small.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Opposite action'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'emotion-regulation'),
  ('effort', 'medium'),
  ('setting', 'anywhere'),
  ('modality', 'dbt')
);

-- Check the facts
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Check the facts',
    'Ask what actually happened, apart from the story your mind is telling. Does the size of the feeling fit the facts? Noticing the gap can soften it.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Check the facts'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'emotion-regulation'),
  ('effort', 'medium'),
  ('setting', 'anywhere'),
  ('modality', 'dbt')
);

-- Self-soothe with your senses
with added as (
  insert into public.skills (user_id, title, description, is_favorite, crisis_priority, is_default, created_at, updated_at)
  select u.id, 'Self-soothe with your senses',
    'Comfort yourself through your senses: something soft to hold, a calming scent, music you love, or something gentle to look at.',
    false, null, true, clock_timestamp(), clock_timestamp()
  from auth.users u
  where not exists (
    select 1 from public.skills s
    where s.user_id = u.id and lower(btrim(s.title)) = lower(btrim('Self-soothe with your senses'))
  )
  returning id
)
insert into public.skill_tags (skill_id, tag_id)
select a.id, t.id from added a cross join public.tags t
where (t.tag_category, t.slug) in (
  ('situation', 'emotion-regulation'),
  ('effort', 'low'),
  ('setting', 'home'),
  ('senses', 'sight'),
  ('senses', 'sound'),
  ('senses', 'smell'),
  ('senses', 'touch'),
  ('modality', 'dbt')
);
