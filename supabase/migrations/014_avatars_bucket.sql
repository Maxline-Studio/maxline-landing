-- 014_avatars_bucket.sql
-- Bucket public pour les photos de profil (petites images).
-- NB : pas de policy SELECT large sur storage.objects → l'accès se fait par URL
-- publique (bucket public), ce qui évite l'énumération des fichiers (advisor 0025).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 2097152,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/gif'];

-- Écriture limitée au dossier de l'utilisateur : avatars/{user_id}/...
drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );
