-- 024_video_subtitles.sql
-- Multilingue « 10 langues d'un seul upload ».
-- Source unique de vérité des sous-titres PAR LANGUE. Aujourd'hui une vidéo a
-- une seule cible (videos.transcription_target). Désormais, chaque langue (la
-- source parlée + chaque traduction) vit dans une ligne de cette table, générée
-- à la demande puis mise en cache. Les timecodes sont partagés (alignement 1:1).
--
-- Modèle éco A « tout inclus » : générer une langue de plus est gratuit.
-- Les colonnes legacy videos.transcription_source/target restent en place comme
-- MIROIR de la langue actuellement affichée (bridge pour le burn jusqu'en Phase 3).

create table if not exists public.video_subtitles (
  video_id    uuid not null references public.videos(id) on delete cascade,
  lang        text not null check (
    lang in ('fr','en','es','de','it','pt','ru','zh','ja','ar')
  ),
  segments    jsonb not null,
  status      text not null default 'ready' check (status in ('ready','generating','failed')),
  user_edited boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (video_id, lang)
);

alter table public.video_subtitles enable row level security;

-- Un utilisateur ne lit/écrit que les sous-titres de SES vidéos (ownership via
-- la table videos). Le worker passe par service_role (bypass RLS).
create policy "video_subtitles_select_own" on public.video_subtitles
  for select using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  );
create policy "video_subtitles_insert_own" on public.video_subtitles
  for insert with check (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  );
create policy "video_subtitles_update_own" on public.video_subtitles
  for update using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  );
create policy "video_subtitles_delete_own" on public.video_subtitles
  for delete using (
    exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid())
  );

-- ─── Backfill de l'existant ───
-- Langue cible (livrable principal) : toujours présente si la vidéo a une cible.
insert into public.video_subtitles (video_id, lang, segments, user_edited)
select v.id, v.target_lang, v.transcription_target, coalesce(v.user_edited, false)
from public.videos v
where v.transcription_target is not null
on conflict (video_id, lang) do nothing;

-- Langue source (référence) : seulement en mode traduction (source ≠ cible).
insert into public.video_subtitles (video_id, lang, segments, user_edited)
select v.id, v.source_lang, v.transcription_source, false
from public.videos v
where v.transcription_source is not null
  and v.source_lang <> v.target_lang
on conflict (video_id, lang) do nothing;
