-- Style des sous-titres choisi par l'utilisateur dans l'éditeur (police, taille,
-- mode fond/contour, couleur). S'applique à l'aperçu et alimentera l'incrustation
-- MP4 (différée). Les exports .srt/.txt restent du texte brut (limitation format).
-- Couvert par la RLS existante de `videos` (l'utilisateur ne modifie que ses vidéos).
alter table public.videos
  add column if not exists subtitle_style jsonb;
