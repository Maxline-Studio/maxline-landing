-- Migration 006 — L'Atelier (backend du système de fidélité)
--
-- Spec : 03-produit/06-atelier-gamification.md
--
-- Décisions de cadrage (Sprint 6) :
--  1. Source de vérité du rang : trigger sur `profiles`. Le code serveur
--     (tickVideoProcessing) reste seul à alimenter lifetime_minutes_used ;
--     le trigger recalcule UNIQUEMENT le rang quand lifetime change, et
--     journalise dans rank_history. Pas de double comptage.
--  2. Parrainage : capturé à l'inscription (referred_by + ligne referrals
--     'pending'), MAIS crédité seulement à la 1re souscription payante
--     (process_referral_conversion, branché au Sprint 5 / Stripe).
--  3. Crons : fonctions SQL + pg_cron planifié. Créditent les minutes et
--     journalisent dans rewards_ledger, SANS email (Sprint 7). No-op tant
--     qu'il n'y a pas d'abonnés payants.
--
-- Les bonus de minutes sont versés dans `credits_minutes` (jamais de reset,
-- consommés après le quota mensuel) — cohérent avec « les minutes bonus
-- n'expirent jamais » du doc. Ils n'augmentent PAS lifetime_minutes_used,
-- donc ne changent pas le rang (le rang ne récompense que l'usage réel).

-- ─────────────────────────────────────────────────────────────────
-- 0. Colonne d'ancrage du streak (absente du schéma initial)
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists streak_anchor_date date;

-- ─────────────────────────────────────────────────────────────────
-- 1. Tables Atelier
-- ─────────────────────────────────────────────────────────────────

-- Journal de toutes les récompenses (audit + transparence user)
create table if not exists public.rewards_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'rank_promotion',
    'streak_bonus',
    'anniversary',
    'referral_inviter',
    'referral_invitee',
    'gift_random',
    'compensation'
  )),
  minutes_bonus numeric(10,2) not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists rewards_ledger_user_idx
  on public.rewards_ledger(user_id, created_at desc);

-- Historique des changements de rang (audit + notifications email à venir)
create table if not exists public.rank_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_rank text not null,
  to_rank text not null,
  triggered_at timestamptz not null default now()
);
create index if not exists rank_history_user_idx
  on public.rank_history(user_id, triggered_at desc);

-- Journal des parrainages
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid references public.profiles(id) on delete set null,
  invitee_email text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'validated', 'revoked')),
  bonus_credited boolean not null default false,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  -- Un invité n'est rattaché qu'à un seul parrainage
  unique (invitee_id)
);
create index if not exists referrals_inviter_idx on public.referrals(inviter_id);
create index if not exists referrals_status_idx on public.referrals(status);

-- ─────────────────────────────────────────────────────────────────
-- 2. RLS — lecture seule pour l'utilisateur sur ses propres lignes.
--    Toute écriture passe par des fonctions SECURITY DEFINER (crons,
--    claim_referral, process_referral_conversion) ou le service_role.
-- ─────────────────────────────────────────────────────────────────
alter table public.rewards_ledger enable row level security;
alter table public.rank_history enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "Users read own rewards" on public.rewards_ledger;
create policy "Users read own rewards" on public.rewards_ledger
  for select using (auth.uid() = user_id);

drop policy if exists "Users read own rank history" on public.rank_history;
create policy "Users read own rank history" on public.rank_history
  for select using (auth.uid() = user_id);

-- L'utilisateur voit les parrainages qu'il a émis ET celui dont il est l'invité
drop policy if exists "Users read own referrals" on public.referrals;
create policy "Users read own referrals" on public.referrals
  for select using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- ─────────────────────────────────────────────────────────────────
-- 3. Recalcul du rang (trigger sur profiles)
-- ─────────────────────────────────────────────────────────────────
-- compute_rank : miroir SQL de lib/atelier.ts computeRank(). Garder
-- les seuils synchronisés (300 / 1200 / 5000).
create or replace function public.compute_rank(p_lifetime numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_lifetime >= 5000 then 'maitre_doeuvre'
    when p_lifetime >= 1200 then 'editeur_en_chef'
    when p_lifetime >= 300  then 'correcteur'
    else 'apprenti'
  end;
$$;

-- BEFORE UPDATE : si lifetime change, recalcule le rang sur NEW et,
-- si le rang change, journalise dans rank_history. Ne ré-écrit pas
-- profiles (pas de récursion) — modifie seulement NEW + insère ailleurs.
create or replace function public.handle_rank_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed text;
begin
  computed := public.compute_rank(new.lifetime_minutes_used);
  if computed is distinct from new.rank then
    insert into public.rank_history(user_id, from_rank, to_rank)
      values (new.id, new.rank, computed);
    new.rank := computed;
    -- TODO Sprint 7 : email « vous êtes maintenant <rang> »
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_rank_recalc on public.profiles;
create trigger profiles_rank_recalc
  before update of lifetime_minutes_used on public.profiles
  for each row
  when (new.lifetime_minutes_used is distinct from old.lifetime_minutes_used)
  execute function public.handle_rank_recalc();

-- ─────────────────────────────────────────────────────────────────
-- 4. Crédit de bonus unifié (toujours journalisé)
-- ─────────────────────────────────────────────────────────────────
-- Seul point d'entrée pour offrir des minutes. Ajoute aux credits_minutes
-- (jamais d'expiration) et écrit une ligne rewards_ledger. SECURITY DEFINER :
-- destiné aux crons / process_referral_conversion / service_role uniquement.
create or replace function public.grant_bonus_minutes(
  p_user_id uuid,
  p_minutes numeric,
  p_type text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_minutes <= 0 then
    return;
  end if;

  update public.profiles
    set credits_minutes = credits_minutes + p_minutes
    where id = p_user_id;

  insert into public.rewards_ledger(user_id, type, minutes_bonus, reason)
    values (p_user_id, p_type, p_minutes, p_reason);
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 5. Parrainage
-- ─────────────────────────────────────────────────────────────────
-- claim_referral : appelé par l'utilisateur connecté (routes auth) avec le
-- code lu depuis le cookie. Pose referred_by (si absent) et crée la ligne
-- referrals 'pending'. AUCUN crédit ici (différé à la conversion payante).
-- Exposée à `authenticated` : tous les contrôles utilisent auth.uid().
create or replace function public.claim_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inviter uuid;
  v_already uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  -- Déjà parrainé ? (idempotent)
  select referred_by into v_already from public.profiles where id = v_uid;
  if v_already is not null then
    return jsonb_build_object('ok', false, 'reason', 'already_referred');
  end if;

  -- Code valide ?
  select id into v_inviter
    from public.profiles
    where referral_code = lower(trim(p_code));
  if v_inviter is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  -- Pas d'auto-parrainage
  if v_inviter = v_uid then
    return jsonb_build_object('ok', false, 'reason', 'self_referral');
  end if;

  update public.profiles set referred_by = v_inviter where id = v_uid;

  insert into public.referrals(inviter_id, invitee_id, status)
    values (v_inviter, v_uid, 'pending')
    on conflict (invitee_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

-- process_referral_conversion : à appeler quand un invité souscrit un plan
-- payant (branché au Sprint 5 / webhook Stripe). Valide le parrainage et
-- crédite +30 min aux DEUX parties, dans la limite du cap mensuel parrain.
create or replace function public.process_referral_conversion(p_invitee_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref record;
  v_accepted_this_month int;
begin
  select * into v_ref
    from public.referrals
    where invitee_id = p_invitee_id
      and status = 'pending'
    limit 1;

  if v_ref is null then
    return;
  end if;

  -- Cap anti-abus : nb de parrainages déjà validés ce mois pour ce parrain
  select count(*) into v_accepted_this_month
    from public.referrals
    where inviter_id = v_ref.inviter_id
      and bonus_credited = true
      and validated_at >= date_trunc('month', now());

  if v_accepted_this_month >= 5 then
    -- Cap atteint : on marque validé sans créditer le parrain (l'invité, lui,
    -- reste éligible). Choix simple MVP : on ne crédite ni l'un ni l'autre,
    -- la référence est consignée comme validée.
    update public.referrals
      set status = 'validated', validated_at = now()
      where id = v_ref.id;
    return;
  end if;

  perform public.grant_bonus_minutes(
    v_ref.inviter_id, 30, 'referral_inviter',
    'Parrainage validé');
  perform public.grant_bonus_minutes(
    p_invitee_id, 30, 'referral_invitee',
    'Bienvenue via parrainage');

  update public.referrals
    set status = 'validated', bonus_credited = true, validated_at = now()
    where id = v_ref.id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 6. Crons (fonctions). Planifiés via pg_cron en section 8.
--    No-op tant qu'il n'y a pas d'abonnés payants. Pas d'email (Sprint 7).
-- ─────────────────────────────────────────────────────────────────

-- Streak mensuel : incrémente le compteur des abonnés payants actifs et,
-- tous les 3 mois consécutifs (rang >= Correcteur), crédite le bonus.
create or replace function public.cron_streak_monthly()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_bonus numeric;
begin
  for r in
    select id, rank, subscription_streak_months
      from public.profiles
      where stripe_subscription_id is not null
        and plan in ('starter', 'plus')
  loop
    update public.profiles
      set subscription_streak_months = r.subscription_streak_months + 1
      where id = r.id;

    if (r.subscription_streak_months + 1) % 3 = 0 then
      v_bonus := case r.rank
        when 'correcteur' then 5
        when 'editeur_en_chef' then 15
        when 'maitre_doeuvre' then 50
        else 0
      end;
      if v_bonus > 0 then
        perform public.grant_bonus_minutes(
          r.id, v_bonus, 'streak_bonus',
          format('Continuité — %s mois', r.subscription_streak_months + 1));
      end if;
    end if;
  end loop;
end;
$$;

-- Anniversaire quotidien : +10 min le jour-mois d'inscription, chaque année
-- révolue. Une seule fois par an (garde-fou via rewards_ledger).
create or replace function public.cron_anniversary_daily()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select id from public.profiles
      where anniversary_date is not null
        and to_char(anniversary_date, 'MM-DD') = to_char(current_date, 'MM-DD')
        and anniversary_date < current_date
        and not exists (
          select 1 from public.rewards_ledger l
          where l.user_id = profiles.id
            and l.type = 'anniversary'
            and l.created_at >= date_trunc('year', now())
        )
  loop
    perform public.grant_bonus_minutes(
      r.id, 10, 'anniversary', 'Anniversaire d''inscription');
  end loop;
end;
$$;

-- Gifts trimestriels : ~10 % des utilisateurs actifs (vidéo dans les 90 j),
-- +20 min surprise. Sélection aléatoire simple pour le MVP.
create or replace function public.cron_gifts_quarterly()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select p.id
      from public.profiles p
      where exists (
        select 1 from public.videos v
        where v.user_id = p.id
          and v.uploaded_at >= now() - interval '90 days')
      and random() < 0.10
  loop
    perform public.grant_bonus_minutes(
      r.id, 20, 'gift_random', 'Cadeau surprise');
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- 7. Backfill : aligner lifetime_minutes_used sur les vidéos déjà 'done'
--    (corrige la désynchro des données insérées en SQL direct).
--    Déclenche au passage le recalcul de rang via le trigger.
-- ─────────────────────────────────────────────────────────────────
update public.profiles p
  set lifetime_minutes_used = sub.total
  from (
    select user_id, coalesce(sum(duration_minutes), 0) as total
      from public.videos
      where status = 'done'
      group by user_id
  ) sub
  where p.id = sub.user_id
    and p.lifetime_minutes_used is distinct from sub.total;

-- ─────────────────────────────────────────────────────────────────
-- 8. Sécurité : révocation des EXECUTE sur les fonctions SECURITY DEFINER
--    non destinées à l'API publique. claim_referral est la seule exposée
--    à `authenticated` (contrôles internes via auth.uid()).
-- ─────────────────────────────────────────────────────────────────
revoke execute on function public.compute_rank(numeric) from public, anon, authenticated;
revoke execute on function public.handle_rank_recalc() from public, anon, authenticated;
revoke execute on function public.grant_bonus_minutes(uuid, numeric, text, text) from public, anon, authenticated;
revoke execute on function public.process_referral_conversion(uuid) from public, anon, authenticated;
revoke execute on function public.cron_streak_monthly() from public, anon, authenticated;
revoke execute on function public.cron_anniversary_daily() from public, anon, authenticated;
revoke execute on function public.cron_gifts_quarterly() from public, anon, authenticated;

revoke execute on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 9. Planification pg_cron (budget 0 €, intégré Supabase)
-- ─────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;

-- Idempotent : on dé-planifie avant de re-planifier.
do $$
declare
  j record;
begin
  for j in
    select jobid from cron.job
    where jobname in ('atelier_streak_monthly',
                      'atelier_anniversary_daily',
                      'atelier_gifts_quarterly')
  loop
    perform cron.unschedule(j.jobid);
  end loop;
end $$;

-- 1er du mois à 04:00 UTC
select cron.schedule('atelier_streak_monthly', '0 4 1 * *',
  $$select public.cron_streak_monthly();$$);

-- Tous les jours à 06:00 UTC (~8h Paris)
select cron.schedule('atelier_anniversary_daily', '0 6 * * *',
  $$select public.cron_anniversary_daily();$$);

-- Le 15 de janvier/avril/juillet/octobre à 10:00 UTC
select cron.schedule('atelier_gifts_quarterly', '0 10 15 1,4,7,10 *',
  $$select public.cron_gifts_quarterly();$$);
