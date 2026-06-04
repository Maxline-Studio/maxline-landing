-- Détection automatique de la langue parlée. Nouvelle colonne booléenne :
--   true  → le worker ignore source_lang à l'entrée et détecte la langue
--            parlée via Whisper (ASR sans paramètre `language`), puis écrit la
--            langue détectée dans source_lang.
--   false → langue imposée par l'utilisateur (comportement historique).
-- source_lang reste NOT NULL + CHECK 10 codes : en mode auto l'app pose un
-- placeholder ('fr') écrasé par la langue détectée. Le flag reste true ensuite
-- (= « langue auto-détectée »).
alter table public.videos
  add column if not exists source_lang_auto boolean not null default false;
