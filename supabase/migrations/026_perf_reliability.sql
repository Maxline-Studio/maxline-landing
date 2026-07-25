-- 026_perf_reliability.sql
-- Audit du cœur (2026-07-25) — performance, fiabilité, nettoyage.
--
-- Cette migration est IDEMPOTENTE : on peut la rejouer sans casse.
--
-- Elle apporte :
--   1. Battement de cœur du worker  → le stale-reaper cesse de tuer les vidéos longues
--   2. Table worker_health          → détecter un worker mort (la sonde actuelle ne le voit pas)
--   3. failed_at                    → la sonde peut enfin compter les échecs
--   4. storage_key_preview          → proxy vidéo 480p pour l'éditeur (aperçu instantané, .mkv/.avi lisibles)
--   5. consume_minutes()            → débit du quota ATOMIQUE (plus de double-débit possible)
--   6. Index de file d'attente      → comptage de file et lecture worker en O(log n)
--   7. RLS video_subtitles          → auth.uid() évalué UNE fois au lieu d'une fois par ligne
--   8. Colonnes mortes supprimées
--
-- NB : `lifetime_counted` N'EST PAS morte (le trigger handle_video_done s'en sert) → conservée.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Battement de cœur du pipeline
-- ═══════════════════════════════════════════════════════════════════
-- Avant : reapStale comparait `processing_started_at` (posé UNE fois, au claim) à
-- 20 minutes. Une vidéo de 30 min met légitimement plus de 20 min → elle était
-- remise en file EN PLEIN TRAITEMENT, repartait de zéro, et finissait 'failed'
-- après 3 reprises. Le worker écrit désormais ici à chaque changement d'étape :
-- le seuil devient « aucun signe de vie depuis X minutes », ce qu'il aurait
-- toujours dû être.

alter table public.videos
  add column if not exists last_heartbeat_at timestamptz;

comment on column public.videos.last_heartbeat_at is
  'Dernier signe de vie du worker sur cette vidéo (écrit à chaque changement d''étape). Base du stale-reaper.';

-- Amorce : les vidéos actuellement en traitement héritent de leur date de départ.
update public.videos
   set last_heartbeat_at = coalesce(processing_started_at, uploaded_at)
 where last_heartbeat_at is null
   and status in ('extracting_audio','transcribing','translating','aligning','generating_subtitles');

-- ═══════════════════════════════════════════════════════════════════
-- 2. Horodatage d'échec (la sonde de santé en dépend)
-- ═══════════════════════════════════════════════════════════════════
-- Avant : /api/cron/health comptait les échecs via `processing_completed_at`,
-- que la branche d'erreur du worker n'écrivait JAMAIS → l'alerte ne pouvait pas
-- se déclencher, quoi qu'il arrive.

alter table public.videos
  add column if not exists failed_at timestamptz;

comment on column public.videos.failed_at is
  'Horodatage du passage en échec. Alimente la surveillance (cron health).';

-- ═══════════════════════════════════════════════════════════════════
-- 3. Proxy vidéo (aperçu éditeur)
-- ═══════════════════════════════════════════════════════════════════
-- Le lecteur servait le fichier SOURCE (jusqu'à 1 Go, codec d'origine) : lent à
-- charger, impossible à scruber, et illisible par le navigateur pour .mkv/.avi.
-- Le worker produit désormais un MP4 H.264 léger, servi à l'éditeur.

alter table public.videos
  add column if not exists storage_key_preview text;

comment on column public.videos.storage_key_preview is
  'Clé R2 du proxy MP4 léger (H.264/AAC) utilisé par l''aperçu de l''éditeur. NULL = on retombe sur la source.';

-- ═══════════════════════════════════════════════════════════════════
-- 4. Santé du worker (détection d'un worker mort)
-- ═══════════════════════════════════════════════════════════════════
-- Le worker ne peut pas signaler lui-même qu'il est mort. Il écrit donc un
-- battement à chaque tick ; c'est l'ABSENCE de battement qui déclenche l'alerte.

create table if not exists public.worker_health (
  id              text primary key,
  last_seen_at    timestamptz not null default now(),
  in_flight       integer not null default 0,
  burns_in_flight integer not null default 0,
  queued          integer not null default 0,
  version         text
);

alter table public.worker_health enable row level security;
-- Aucune policy : seul service_role (qui contourne la RLS) lit et écrit ici.
-- Le worker écrit, le cron de surveillance lit — tous deux en service_role.

comment on table public.worker_health is
  'Battement de cœur du worker VM. Une seule ligne (id = ''worker''). Absence de battement récent = worker à l''arrêt.';

-- ═══════════════════════════════════════════════════════════════════
-- 5. Débit des minutes ATOMIQUE
-- ═══════════════════════════════════════════════════════════════════
-- Avant : l'app lisait le profil, calculait en JavaScript, puis écrivait. Deux
-- uploads terminés en même temps pouvaient consommer les mêmes minutes deux fois.
-- Ici, `for update` sérialise les concurrents sur la ligne du profil.
--
-- Sécurité : EXECUTE réservé à service_role (modèle de la migration 015 — le rôle
-- `authenticated` ne doit jamais pouvoir toucher quota/crédits). L'app l'appelle
-- avec le client admin.

create or replace function public.consume_minutes(
  p_user_id uuid,
  p_minutes numeric
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_quota_avail numeric;
  v_credits     numeric;
  v_from_quota  numeric;
begin
  if p_minutes is null or p_minutes <= 0 then
    return true; -- rien à débiter
  end if;

  -- Verrou de ligne : les débits concurrents du même profil se sérialisent.
  select greatest(quota_minutes_total - quota_minutes_used, 0), credits_minutes
    into v_quota_avail, v_credits
    from public.profiles
   where id = p_user_id
     for update;

  if not found then
    return false;
  end if;

  if (v_quota_avail + v_credits) < p_minutes then
    return false; -- solde insuffisant : aucun débit, l'appelant décide quoi faire
  end if;

  -- Quota mensuel d'abord, crédits ensuite (règle produit inchangée).
  v_from_quota := least(v_quota_avail, p_minutes);

  update public.profiles
     set quota_minutes_used = quota_minutes_used + v_from_quota,
         credits_minutes    = credits_minutes - (p_minutes - v_from_quota)
   where id = p_user_id;

  return true;
end;
$$;

revoke all on function public.consume_minutes(uuid, numeric) from public;
revoke all on function public.consume_minutes(uuid, numeric) from anon;
revoke all on function public.consume_minutes(uuid, numeric) from authenticated;
grant execute on function public.consume_minutes(uuid, numeric) to service_role;

comment on function public.consume_minutes(uuid, numeric) is
  'Débite p_minutes du quota puis des crédits, de façon ATOMIQUE. Renvoie false si le solde est insuffisant (aucun débit effectué). service_role uniquement.';

-- Le RPC get_user_minutes_available avait son EXECUTE révoqué : l'app l'appelait
-- à chaque upload, l'appel échouait systématiquement, puis elle lisait le profil
-- en repli. Un aller-retour + une erreur Postgres par dépôt, par construction.
-- L'app ne l'appelle plus (elle lit le profil directement, couvert par la RLS).
drop function if exists public.get_user_minutes_available(uuid);

-- ═══════════════════════════════════════════════════════════════════
-- 6. Index des chemins chauds
-- ═══════════════════════════════════════════════════════════════════

-- File d'attente : sert AU MÊME TEMPS la lecture du worker (fetchQueued) et le
-- comptage « combien de vidéos devant moi » affiché pendant l'attente.
create index if not exists videos_queue_idx
  on public.videos (uploaded_at)
  where status = 'queued' and storage_key_source is not null;

-- Stale-reaper : balayage des vidéos sans signe de vie.
create index if not exists videos_heartbeat_idx
  on public.videos (last_heartbeat_at)
  where status in ('extracting_audio','transcribing','translating','aligning','generating_subtitles');

-- File d'incrustation.
create index if not exists videos_burn_queue_idx
  on public.videos (burn_requested_at)
  where burn_status = 'queued';

-- Liste « Mes vidéos » et tableau de bord (tri par date, par utilisateur).
create index if not exists videos_user_recent_idx
  on public.videos (user_id, uploaded_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- 7. RLS video_subtitles — auth.uid() évalué une seule fois
-- ═══════════════════════════════════════════════════════════════════
-- `auth.uid()` appelé nu dans un EXISTS peut être réévalué par ligne. Enveloppé
-- dans un sous-select, Postgres le traite comme une constante d'exécution.
-- Sémantique strictement identique.

drop policy if exists "video_subtitles_select_own" on public.video_subtitles;
drop policy if exists "video_subtitles_insert_own" on public.video_subtitles;
drop policy if exists "video_subtitles_update_own" on public.video_subtitles;
drop policy if exists "video_subtitles_delete_own" on public.video_subtitles;

create policy "video_subtitles_select_own" on public.video_subtitles
  for select using (
    exists (
      select 1 from public.videos v
       where v.id = video_id and v.user_id = (select auth.uid())
    )
  );

create policy "video_subtitles_insert_own" on public.video_subtitles
  for insert with check (
    exists (
      select 1 from public.videos v
       where v.id = video_id and v.user_id = (select auth.uid())
    )
  );

create policy "video_subtitles_update_own" on public.video_subtitles
  for update using (
    exists (
      select 1 from public.videos v
       where v.id = video_id and v.user_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.videos v
       where v.id = video_id and v.user_id = (select auth.uid())
    )
  );

create policy "video_subtitles_delete_own" on public.video_subtitles
  for delete using (
    exists (
      select 1 from public.videos v
       where v.id = video_id and v.user_id = (select auth.uid())
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- 8. Colonnes mortes
-- ═══════════════════════════════════════════════════════════════════
-- Déclarées à l'origine, jamais écrites par aucun code (app ni worker) :
--   processing_steps   — remplacé par `status` + les logs worker
--   storage_key_audio  — l'audio extrait reste local sur la VM, jamais stocké
--   resolution         — jamais renseignée
--   retranslations_used— vestige du modèle « re-traduction payante », abandonné
--                        au profit du « tout inclus » (les langues sont gratuites)

alter table public.videos drop column if exists processing_steps;
alter table public.videos drop column if exists storage_key_audio;
alter table public.videos drop column if exists resolution;
alter table public.videos drop column if exists retranslations_used;
