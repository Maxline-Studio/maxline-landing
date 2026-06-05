-- Noms propres à respecter (marques, prénoms, noms, pseudos, domaines…) déclarés
-- par l'utilisateur à l'upload. Injectés dans l'amorce ASR (Whisper les
-- orthographie correctement) ET dans la traduction (préservés tels quels).
-- Corrige le cas « Maxline » → « maxlang » : un nom propre inventé n'existe pas
-- dans le vocabulaire du modèle, il faut le lui souffler.
alter table public.videos
  add column if not exists important_terms text;
