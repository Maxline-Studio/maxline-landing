-- Migration 005 — Bucket de stockage des vidéos
--
-- Bucket privé 'videos'. Les fichiers sont rangés par user :
--   {user_id}/{video_id}/source.{ext}
--   {user_id}/{video_id}/audio.mp3
--   {user_id}/{video_id}/subtitles.srt / .vtt
--   {user_id}/{video_id}/burned.mp4
--
-- RLS : un utilisateur ne peut lire/écrire que dans son propre dossier
-- (premier segment du path = son auth.uid()).
--
-- NOTE migration future R2 : quand on bascule vers Cloudflare R2 (zéro egress),
-- ce bucket reste pour les fichiers legacy. La nouvelle abstraction lib/storage.ts
-- pointera vers R2 via S3-compatible API. Voir 04-technique/01-stack.md.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  1073741824,  -- 1 Go
  array[
    'video/mp4',
    'video/quicktime',      -- .mov
    'video/x-msvideo',      -- .avi
    'video/x-matroska',     -- .mkv
    'video/webm',
    'audio/mpeg',
    'text/plain',
    'text/vtt',
    'application/x-subrip'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own video files" on storage.objects;
create policy "Users upload own video files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read own video files" on storage.objects;
create policy "Users read own video files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update own video files" on storage.objects;
create policy "Users update own video files" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own video files" on storage.objects;
create policy "Users delete own video files" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
