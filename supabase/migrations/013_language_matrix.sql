-- 013_language_matrix.sql
-- Matrice de langues : la transcription n'est plus figée FR (source) → EN (cible).
-- On renomme les deux colonnes vers une sémantique générique source/cible, et on
-- ajoute les langues de chaque vidéo. Les lignes existantes (toutes FR→EN) restent
-- cohérentes via les valeurs par défaut.
--
-- Modes :
--   source_lang != target_lang  → traduction (FR→EN, EN→FR) : target = traduction,
--                                  source = référence (italique dans l'éditeur)
--   source_lang  = target_lang  → transcription (FR→FR, EN→EN) : target seul, source null

alter table public.videos rename column transcription_fr to transcription_source;
alter table public.videos rename column transcription_en to transcription_target;

alter table public.videos
  add column if not exists source_lang text not null default 'fr',
  add column if not exists target_lang text not null default 'en';

-- Contraintes de validité des langues (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'videos_source_lang_check'
  ) then
    alter table public.videos
      add constraint videos_source_lang_check check (source_lang in ('fr', 'en'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'videos_target_lang_check'
  ) then
    alter table public.videos
      add constraint videos_target_lang_check check (target_lang in ('fr', 'en'));
  end if;
end $$;
