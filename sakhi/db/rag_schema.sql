-- db/rag_schema.sql
--
-- Run this once in your Supabase project's SQL editor (Dashboard -> SQL Editor
-- -> New query -> paste -> Run) before running scripts/ingest-schemes.js.
--
-- Sets up a pgvector-backed store for scheme documents so the assistant can
-- do semantic (RAG) search over a large scheme corpus, separate from the
-- small hand-curated SCHEMES array in data/schemes.js that the deterministic
-- eligibility engine uses. gemini-embedding-001 outputs 3072-dim vectors by
-- default, hence vector(3072) below — change this if you switch embedding
-- models or request a smaller output dimension.

-- 1. Enable the pgvector extension (bundled with Supabase, just needs turning on)
create extension if not exists vector;

-- 2. The document table
create table if not exists scheme_documents (
  id           bigserial primary key,
  scheme_id    text,                  -- stable id, e.g. "up-widow-pension" (nullable: not every corpus row will map to one)
  title        text not null,
  state        text,                  -- "central" or a state name, for optional filtering
  category     text,
  source_url   text,
  content      text not null,         -- the chunk of text that was embedded
  embedding    vector(3072) not null,
  created_at   timestamptz not null default now()
);

-- Re-running ingestion for the same scheme_id replaces rather than duplicates.
-- (No partial WHERE clause here — Postgres can't use a conditional unique index
-- as an ON CONFLICT target, which scripts/ingest-schemes.js's upsert needs.)
create unique index if not exists scheme_documents_scheme_id_key
  on scheme_documents (scheme_id);

-- 3. Vector similarity index.
-- ivfflat needs at least ~1000 rows and an ANALYZE to be effective; for a
-- corpus in the low thousands (e.g. myScheme's ~4,700 schemes) this is
-- exactly the right size. If you're only testing with the ~30-row seed
-- corpus, the index is a no-op until you load more data (a sequential scan
-- is instant either way at that size).
create index if not exists scheme_documents_embedding_idx
  on scheme_documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Similarity search RPC — this is what lib/ragSearch.js calls.
-- Cosine distance via the <=> operator; we return 1 - distance as a
-- similarity score in [-1, 1] (in practice ~[0, 1]) so callers can filter
-- with a familiar "higher is better" threshold.
create or replace function match_scheme_documents(
  query_embedding vector(3072),
  match_count int default 5,
  filter_state text default null
)
returns table (
  id bigint,
  scheme_id text,
  title text,
  state text,
  category text,
  source_url text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    scheme_id,
    title,
    state,
    category,
    source_url,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from scheme_documents
  where filter_state is null
     or state = filter_state
     or state = 'central'
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- After a large ingest, run this once so the query planner has fresh stats
-- for the ivfflat index:
-- analyze scheme_documents;

-- 5. Full-text keyword search fallback.
--
-- lib/ragSearch.js needs a keyword search path for when vector search can't
-- run (no GEMINI_API_KEY, a rate-limited/erroring embedding call, etc) but
-- Supabase itself is fine — so the real ingested corpus is still searchable,
-- not just the ~30-scheme bundled seed corpus. A naive `content ILIKE
-- '%word%'` scan works but is an unindexed sequential scan over every row's
-- full text, which gets slow as the corpus grows. Postgres full-text search
-- (tsvector + a GIN index) is the standard fix: indexed, and ranked by
-- actual term relevance (ts_rank) instead of raw substring hits.

-- Generated column: kept in sync automatically whenever title/content change,
-- no ingestion-side code needs to populate it. Title is weighted higher ('A')
-- than body content ('B') so a query matching the scheme name ranks first.
alter table scheme_documents
  add column if not exists content_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;

create index if not exists scheme_documents_content_tsv_idx
  on scheme_documents using gin (content_tsv);

-- websearch_to_tsquery (not plainto_tsquery/to_tsquery) is deliberate: it's
-- built for raw, unvalidated user input — it won't throw a syntax error on
-- stray punctuation the way to_tsquery does, and it understands quoted
-- phrases and "-exclude" the way a citizen's free-text question might.
create or replace function keyword_search_scheme_documents(
  search_query text,
  match_count int default 5,
  filter_state text default null
)
returns table (
  id bigint,
  scheme_id text,
  title text,
  state text,
  category text,
  source_url text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id, scheme_id, title, state, category, source_url, content,
    ts_rank(content_tsv, websearch_to_tsquery('english', search_query)) as similarity
  from scheme_documents
  where content_tsv @@ websearch_to_tsquery('english', search_query)
    and (filter_state is null or state = filter_state or state = 'central')
  order by similarity desc
  limit match_count;
$$;

-- Existing rows backfill content_tsv automatically since it's a generated
-- column (no separate backfill script needed), but refresh planner stats
-- after running this migration against an already-populated table:
-- analyze scheme_documents;
