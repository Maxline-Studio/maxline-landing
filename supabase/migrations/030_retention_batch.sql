-- 030_retention_batch.sql
-- Audit des réglages (2026-07-27).
--
-- Changer la durée de rétention recalculait `delete_at` vidéo par vidéo, en
-- boucle, avec un aller-retour réseau PAR VIDÉO. Un compte avec 50 vidéos
-- déclenchait 50 requêtes enchaînées : plusieurs secondes d'attente, et le
-- risque que la server action soit coupée avant la fin (rétention alors
-- incohérente entre les vidéos).
--
-- Un seul UPDATE fait le travail. `security invoker` : la fonction s'exécute
-- avec les droits de l'appelant, donc la RLS s'applique normalement et un
-- utilisateur ne peut toucher que ses propres vidéos.

create or replace function public.reset_video_retention(p_days integer)
returns integer
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_count integer;
begin
  if p_days is null or p_days not in (7, 14, 30) then
    raise exception 'Durée de rétention invalide : %', p_days;
  end if;

  update public.videos
     set delete_at = uploaded_at + make_interval(days => p_days)
   where user_id = (select auth.uid())
     and delete_at is not null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.reset_video_retention(integer) to authenticated;

comment on function public.reset_video_retention(integer) is
  'Recalcule delete_at de toutes les vidéos de l''utilisateur courant en un seul UPDATE. security invoker : la RLS borne l''effet au propriétaire.';
