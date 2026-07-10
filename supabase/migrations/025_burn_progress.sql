-- 025 — Progression de l'incrustation MP4 (burn-in).
-- Le réencodage complet d'une vidéo peut durer plusieurs minutes sur la petite VM.
-- Le worker publie ici la progression FFmpeg (0-99 %, puis 100 % à la fin) pour que
-- l'éditeur affiche une vraie barre au lieu d'un spinner figé.

alter table public.videos
  add column if not exists burn_progress smallint not null default 0;

comment on column public.videos.burn_progress is
  'Progression de l''incrustation MP4 en % (0-100). Écrit par le worker (burn-job) pendant l''encodage FFmpeg.';
