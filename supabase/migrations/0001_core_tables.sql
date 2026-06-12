-- 0001_core_tables.sql
-- Core schema for Anchor.
--
-- This migration defines tables and indexes ONLY. Two things are deliberately
-- deferred to later migrations so each concern lands as its own reviewable unit:
--   * 0002 — Row-Level Security (the security boundary; see CLAUDE.md / PROJECT.md §7)
--   * 0003 — the security-definer signup trigger that seeds default skills per user
--
-- NOTE: these tables are NOT safe to expose until 0002 enables RLS. With RLS off
-- and the public anon key, every row would be world-readable.

-- skills: a user's personal coping skills.
create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  is_favorite boolean not null default false,
  -- Lower = shown first in crisis mode. NULL = not in the go-to set.
  -- Not unique per user; ties are broken on a secondary sort (e.g. most-recently-used).
  crisis_priority int,
  -- True for skills copied from the seed set on signup (see migration 0003).
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index skills_user_id_idx on skills (user_id);
create index skills_user_crisis_priority_idx on skills (user_id, crisis_priority);

-- tag_categories: global, seeded, read-only vocabulary.
-- Categories: situation, effort, setting, senses, modality (see PROJECT.md §9).
create table tag_categories (
  slug text primary key,
  name text not null,
  -- effort = false (single-select); the rest = true (multi-select).
  is_multi_select boolean not null,
  is_optional boolean not null default true,
  sort_order int not null default 0
);

-- tags: global, seeded, read-only values within each category.
create table tags (
  id uuid primary key default gen_random_uuid(),
  tag_category text not null references tag_categories (slug) on update cascade,
  label text not null,
  slug text not null,
  -- Ordinal rank within the category. For effort this is load-bearing
  -- (low < medium < high); elsewhere it is just display order.
  sort_order int not null default 0
);

create unique index tags_category_slug_uniq on tags (tag_category, slug);

-- skill_tags: many-to-many between a user's skills and the global tags.
create table skill_tags (
  skill_id uuid not null references skills (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (skill_id, tag_id)
);

create index skill_tags_tag_id_idx on skill_tags (tag_id);

-- usage_logs: one row per logged use. Logging is low-friction —
-- only user, skill, and timestamp are required.
create table usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references skills (id) on delete cascade,
  used_at timestamptz not null default now(),
  -- 1-5, nullable. NULL = logged but not yet reflected on.
  helpfulness int check (helpfulness between 1 and 5),
  note text
);

create index usage_logs_user_used_at_idx on usage_logs (user_id, used_at);
create index usage_logs_skill_id_idx on usage_logs (skill_id);

-- Keep skills.updated_at current on every update.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger skills_set_updated_at
  before update on skills
  for each row
  execute function set_updated_at();
