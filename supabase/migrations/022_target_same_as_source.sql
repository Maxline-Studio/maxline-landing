-- « Sous-titres dans la langue parlée » (transcription) comme choix de sortie,
-- y compris quand la langue parlée est auto-détectée. Nouvelle colonne :
--   true  → la cible suit la source : le worker résout target_lang = source_lang
--            (détectée ou imposée) → mode transcription, pas de traduction.
--   false → cible explicite choisie par l'utilisateur (comportement historique).
-- target_lang reste NOT NULL + CHECK 10 codes : en mode « suit la source » +
-- détection auto, l'app pose un placeholder écrasé par le worker.
alter table public.videos
  add column if not exists target_same_as_source boolean not null default false;
