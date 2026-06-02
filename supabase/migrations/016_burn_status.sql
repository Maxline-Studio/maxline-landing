-- Burn-in MP4 à la demande : suivi du job d'incrustation.
-- burn_status : idle (jamais demandé) → queued (demandé par l'utilisateur) →
--   burning (worker en cours) → done (burned.mp4 prêt) → failed (erreur).
-- Écrit par le worker (service_role) et par l'app via client admin (cohérent
-- avec le modèle migration 015 : authenticated ne modifie pas ces colonnes).
alter table public.videos
  add column if not exists burn_status text not null default 'idle'
    check (burn_status in ('idle','queued','burning','done','failed')),
  add column if not exists burn_error text,
  add column if not exists burn_requested_at timestamptz;

comment on column public.videos.burn_status is
  'État du job d''incrustation MP4 (burn-in). idle/queued/burning/done/failed.';
