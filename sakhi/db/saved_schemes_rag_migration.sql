-- db/saved_schemes_rag_migration.sql
--
-- Run this once in your Supabase SQL editor (same place you ran rag_schema.sql).
-- Safe to run even if you've never touched saved_schemes before, or run it again —
-- every statement here is idempotent.
--
-- Why: saved_schemes previously only stored scheme_id, which worked fine when every
-- saved scheme was one of the ~30 in data/schemes.js (the saved-schemes page just
-- looked up the id there for title/description/etc). Once you can save a scheme
-- from the 3,000+ RAG corpus too, its scheme_id won't be in that local file — so
-- the page needs somewhere to get the title/link from. These two nullable columns
-- are that: NULL for the local 30 (unchanged behavior), populated for RAG saves.

create table if not exists saved_schemes (
  id         bigserial primary key,
  session_id text not null,
  scheme_id  text not null,
  saved_at   timestamptz not null default now(),
  unique (session_id, scheme_id)
);

alter table saved_schemes add column if not exists title text;
alter table saved_schemes add column if not exists source_url text;
