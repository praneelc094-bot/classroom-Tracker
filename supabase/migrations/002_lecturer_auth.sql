-- Classroom Tracker: tie lectures to the signed-in teacher (Google sign-in via Supabase Auth)
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- for project ref hnhheydwvgroahkywfsp, AFTER enabling the Google provider under
-- Authentication -> Providers (see README notes in this repo for the Google Cloud steps).

-- ============================================================
-- 1. Lectures now belong to the teacher who recorded them
-- ============================================================
alter table lectures
  add column if not exists lecturer_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_lectures_lecturer on lectures (lecturer_id);

-- ============================================================
-- 2. Row Level Security: replace the old "anyone with the anon
--    key can do anything" policies with per-teacher ownership.
--    A row with lecturer_id = null (recorded before this migration,
--    or by a client that failed to attach a user) is no longer
--    reachable by anyone through the anon key - that's intentional.
-- ============================================================
drop policy if exists "anon full access" on lectures;
create policy "lecturer manages own lectures" on lectures
  for all
  using (auth.uid() = lecturer_id)
  with check (auth.uid() = lecturer_id);

drop policy if exists "anon full access" on transcript_windows;
create policy "lecturer manages own windows" on transcript_windows
  for all
  using (exists (
    select 1 from lectures l where l.id = transcript_windows.lecture_id and l.lecturer_id = auth.uid()
  ))
  with check (exists (
    select 1 from lectures l where l.id = transcript_windows.lecture_id and l.lecturer_id = auth.uid()
  ));

drop policy if exists "anon full access" on lecture_images;
create policy "lecturer manages own images" on lecture_images
  for all
  using (exists (
    select 1 from lectures l where l.id = lecture_images.lecture_id and l.lecturer_id = auth.uid()
  ))
  with check (exists (
    select 1 from lectures l where l.id = lecture_images.lecture_id and l.lecturer_id = auth.uid()
  ));

-- ============================================================
-- 3. Storage: only a signed-in teacher can upload; the bucket
--    stays publicly readable so approved images still render on
--    the history page and projector without extra round trips.
-- ============================================================
drop policy if exists "lecture-images write" on storage.objects;
create policy "lecture-images write (signed in only)" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'lecture-images');
