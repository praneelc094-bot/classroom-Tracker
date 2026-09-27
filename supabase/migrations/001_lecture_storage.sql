-- Classroom Tracker: lecture archive schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- for project ref hnhheydwvgroahkywfsp.

-- ============================================================
-- 1. Lectures: one row per recording/session
-- ============================================================
create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  subject text not null default 'unknown',
  model text,
  source text default 'live',              -- 'live' (mic) or 'transcript' (test mode)
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_windows int default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Transcript windows: one row per 15-second window
--    (what was said + the detected topic for it)
-- ============================================================
create table if not exists transcript_windows (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references lectures(id) on delete cascade,
  window_index int not null,
  start_sec int,
  end_sec int,
  transcript_text text,
  topic text,
  keywords text[],
  confidence numeric,
  on_topic boolean,
  model text,
  latency_ms int,
  source text default 'live',
  expected_topic text,          -- only set in transcript-test mode
  verdict text,                 -- 'correct' | 'wrong' (teacher's own judging)
  correct_topic text,
  image_query text,
  image_verdict text,           -- 'approved' | 'skipped' | 'none found' | 'ignored'
  image_tries int,
  created_at timestamptz not null default now(),
  unique (lecture_id, window_index)
);

create index if not exists idx_transcript_windows_lecture
  on transcript_windows (lecture_id, window_index);

-- ============================================================
-- 3. Approved images: the actual archive of what was shown
--    on the projector, with a permanent copy in Storage
-- ============================================================
create table if not exists lecture_images (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references lectures(id) on delete cascade,
  window_id uuid references transcript_windows(id) on delete set null,
  topic text,
  title text,
  artist text,
  license text,
  source_url text,             -- original Wikimedia Commons file URL
  source_page text,            -- Wikimedia Commons description page (for attribution)
  storage_path text,           -- path inside the 'lecture-images' bucket
  public_url text,             -- cached public URL for quick display
  approved_at timestamptz not null default now()
);

create index if not exists idx_lecture_images_lecture
  on lecture_images (lecture_id, approved_at);

-- ============================================================
-- 4. Storage bucket to hold the actual image files
--    (Wikimedia URLs can change/disappear later, so we keep our own copy)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lecture-images', 'lecture-images', true)
on conflict (id) do nothing;

-- ============================================================
-- 5. Row Level Security
--    This app has no login screen yet - it runs entirely client-side
--    with the public "anon" key, so for now every row is readable and
--    writable by anyone holding that key (same trust level as the rest
--    of the static site). If you later add a login for the lecturer,
--    tighten these to `using (auth.uid() = lecturer_id)` etc.
-- ============================================================
alter table lectures enable row level security;
alter table transcript_windows enable row level security;
alter table lecture_images enable row level security;

drop policy if exists "anon full access" on lectures;
create policy "anon full access" on lectures
  for all using (true) with check (true);

drop policy if exists "anon full access" on transcript_windows;
create policy "anon full access" on transcript_windows
  for all using (true) with check (true);

drop policy if exists "anon full access" on lecture_images;
create policy "anon full access" on lecture_images
  for all using (true) with check (true);

-- Storage policies: allow the anon key to read/write inside the bucket
drop policy if exists "lecture-images read" on storage.objects;
create policy "lecture-images read" on storage.objects
  for select using (bucket_id = 'lecture-images');

drop policy if exists "lecture-images write" on storage.objects;
create policy "lecture-images write" on storage.objects
  for insert with check (bucket_id = 'lecture-images');
