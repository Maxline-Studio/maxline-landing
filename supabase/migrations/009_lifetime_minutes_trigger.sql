-- Sprint 3 — Source UNIQUE du comptage des minutes "à vie" (progression Atelier).
-- Avant : le worker MOCK bumpait lifetime_minutes_used dans l'app (tickVideoProcessing).
-- Le vrai worker (service_role) marquera 'done' lui aussi → on centralise le bump
-- dans un trigger sur videos, qui fonctionne quel que soit l'acteur (mock OU worker).
-- Le bump de profiles.lifetime_minutes_used déclenche ensuite profiles_rank_recalc
-- (BEFORE UPDATE) qui recalcule le rang. Aucun double comptage : garde lifetime_counted.
--
-- NB : la fonction est corrigée en 010 (les colonnes générées comme duration_minutes
-- ne sont pas encore calculées dans un trigger BEFORE UPDATE → on lit duration_seconds).

-- 1) Garde anti-rejeu : une vidéo ne compte qu'une fois ses minutes "à vie".
alter table public.videos
  add column if not exists lifetime_counted boolean not null default false;

-- Les vidéos déjà 'done' ont déjà été comptées (par le mock) → on les marque
-- pour ne jamais les recompter si elles sont re-touchées.
update public.videos set lifetime_counted = true where status = 'done';

-- 2) Fonction trigger : au passage à 'done', crédite les minutes "à vie".
create or replace function public.handle_video_done()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $$
begin
  if new.status = 'done'
     and old.status is distinct from 'done'
     and new.lifetime_counted = false then
    update public.profiles
      set lifetime_minutes_used = lifetime_minutes_used + coalesce(new.duration_minutes, 0)
      where id = new.user_id;
    new.lifetime_counted := true;
  end if;
  return new;
end;
$$;

drop trigger if exists videos_done_lifetime on public.videos;
create trigger videos_done_lifetime
  before update on public.videos
  for each row
  execute function public.handle_video_done();
