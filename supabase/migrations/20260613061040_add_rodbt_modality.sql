-- Add RODBT (Radically Open DBT) to the modality vocabulary.
-- A distinct, frequently-used approach in the owner's toolkit, separate from
-- standard DBT. Extends the seeded vocabulary from 0003; idempotent so re-runs
-- are safe. sort_order 50 appends it after the existing modality tags
-- (dbt 10, cbt 20, act 30, mindfulness 40).
insert into tags (tag_category, label, slug, sort_order) values
  ('modality', 'RODBT', 'rodbt', 50)
on conflict (tag_category, slug) do nothing;
