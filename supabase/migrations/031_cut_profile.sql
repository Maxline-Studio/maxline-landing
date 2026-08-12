-- Profil de découpe des sous-titres, choisi par l'utilisateur à l'upload.
--
-- Jusqu'ici un SEUL profil était imposé à tout le monde : « court », avec un
-- plafond DUR de six mots par sous-titre et une coupure à CHAQUE virgule. C'est
-- ce qui hachait les phrases — et, comme la traduction se faisait ensuite sur
-- ces fragments, ce qui produisait les enchaînements incohérents.
--
--   court      → réseaux sociaux (TikTok/Reels/Shorts) : une ligne brève,
--                idéal pour le karaoké mot-à-mot et la vidéo verticale.
--   equilibre  → LE DÉFAUT : des groupes de sens complets, une ligne la
--                plupart du temps, deux quand la phrase le demande.
--   broadcast  → norme télé/cinéma : deux lignes de 42 caractères, rythme posé.
--
-- Les vidéos déjà traitées gardent leurs sous-titres tels quels : la colonne
-- ne sert qu'aux traitements à venir.
alter table public.videos
  add column if not exists cut_profile text not null default 'equilibre';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'videos_cut_profile_check'
  ) then
    alter table public.videos
      add constraint videos_cut_profile_check
      check (cut_profile in ('court', 'equilibre', 'broadcast'));
  end if;
end $$;

-- Le rôle `authenticated` doit pouvoir écrire cette colonne à l'upload
-- (modèle de privilèges par colonne, cf. migration 015).
grant update (cut_profile) on public.videos to authenticated;
