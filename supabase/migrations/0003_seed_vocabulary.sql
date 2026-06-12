-- 0003_seed_vocabulary.sql
-- Global, seeded, read-only tag vocabulary (PROJECT.md §9).
--
-- This lives in a migration (not seed.sql) so it deploys to the live project via
-- `supabase db push` — the signup trigger in 0004 reads these rows at runtime, and
-- the finder filters on them. Idempotent (on conflict do nothing) so re-running is safe.
--
-- sort_order is spaced by 10 so new tags can slot between existing ones without
-- renumbering. For every category except effort it is just display order; for
-- effort it is a true ordinal rank (low < medium < high) and is load-bearing.

insert into tag_categories (slug, name, is_multi_select, is_optional, sort_order) values
  ('situation', 'Situation', true,  false, 10),
  ('effort',    'Effort',    false, false, 20),
  ('setting',   'Setting',   true,  false, 30),
  ('senses',    'Senses',    true,  true,  40),
  ('modality',  'Modality',  true,  true,  50)
on conflict (slug) do nothing;

insert into tags (tag_category, label, slug, sort_order) values
  -- Situation — the primary axis (required, multi-select).
  ('situation', 'Crisis',             'crisis',             10),
  ('situation', 'Emotion regulation', 'emotion-regulation', 20),
  ('situation', 'Distraction',        'distraction',        30),
  ('situation', 'Life-building',      'life-building',      40),

  -- Effort — single-select; sort_order is the ordinal rank (low < medium < high).
  ('effort', 'Low',    'low',    10),
  ('effort', 'Medium', 'medium', 20),
  ('effort', 'High',   'high',   30),

  -- Setting — where the skill can be used (required, multi-select).
  ('setting', 'Anywhere',       'anywhere',       10),
  ('setting', 'Home',           'home',           20),
  ('setting', 'Work or school', 'work-or-school', 30),
  ('setting', 'Outdoors',       'outdoors',       40),
  ('setting', 'Out in public',  'out-in-public',  50),

  -- Senses — optional, multi-select.
  ('senses', 'Sight',               'sight',    10),
  ('senses', 'Sound',               'sound',    20),
  ('senses', 'Touch',               'touch',    30),
  ('senses', 'Taste',               'taste',    40),
  ('senses', 'Smell',               'smell',    50),
  ('senses', 'Movement / physical', 'movement', 60),

  -- Modality — optional, multi-select.
  ('modality', 'DBT',         'dbt',         10),
  ('modality', 'CBT',         'cbt',         20),
  ('modality', 'ACT',         'act',         30),
  ('modality', 'Mindfulness', 'mindfulness', 40)
on conflict (tag_category, slug) do nothing;
