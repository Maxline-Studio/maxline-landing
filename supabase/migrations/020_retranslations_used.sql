-- Compteur de re-traductions (changement de langue dans l'éditeur). La 1re est
-- gratuite (correction d'erreur) ; les suivantes coûtent les minutes de la vidéo.
-- Ne compte que les changements vers une langue ≠ source (vraies traductions).
alter table public.videos
  add column if not exists retranslations_used integer not null default 0;
