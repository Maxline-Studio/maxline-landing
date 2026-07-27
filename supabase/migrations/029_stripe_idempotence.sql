-- 029_stripe_idempotence.sql
-- Audit de la facturation (2026-07-27) — deux défauts sur le chemin de l'argent.
--
-- ① REJEU DE WEBHOOK → CRÉDITS DOUBLÉS
--    Stripe documente explicitement que le MÊME événement peut être livré
--    plusieurs fois (retentative après timeout, après une réponse 5xx, ou
--    simplement en double). Or l'achat d'un pack créditait sans garde :
--        select credits_minutes → update credits_minutes = lu + minutes
--    Un rejeu ajoutait donc les minutes une seconde fois. Et comme la route
--    renvoyait 500 sur toute exception, elle PROVOQUAIT elle-même la
--    retentative. On journalise désormais chaque `event.id` traité : le second
--    passage est ignoré.
--
-- ② LECTURE-MODIFICATION-ÉCRITURE → CRÉDITS PERDUS
--    Deux événements traités en même temps lisaient la même valeur et
--    s'écrasaient l'un l'autre (l'utilisateur perdait un pack). Même défaut que
--    celui corrigé sur le quota en migration 026. On passe par un UPDATE
--    arithmétique, atomique par nature.

-- ─────────────────────────────────────────────────────────────────
-- 1. Journal des événements Stripe déjà traités
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.stripe_events (
  id          text primary key,   -- evt_… (identifiant Stripe, unique par événement)
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Aucune policy : seul service_role (qui contourne la RLS) y accède — c'est le
-- webhook. Rien de tout cela n'est exposé à l'API publique.

comment on table public.stripe_events is
  'Événements Stripe déjà traités. Le webhook insère l''id AVANT de traiter : une seconde livraison du même événement est ignorée (idempotence). En cas d''échec, la ligne est retirée pour autoriser la retentative.';

create index if not exists stripe_events_received_at_idx
  on public.stripe_events (received_at desc);

-- ─────────────────────────────────────────────────────────────────
-- 2. Ajout de crédits ATOMIQUE
-- ─────────────────────────────────────────────────────────────────
-- `credits_minutes = credits_minutes + x` est évalué par Postgres sur la valeur
-- courante de la ligne, sous verrou : deux appels concurrents s'additionnent au
-- lieu de s'écraser.
create or replace function public.add_credit_minutes(
  p_user_id uuid,
  p_minutes numeric
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_found boolean;
begin
  if p_minutes is null or p_minutes <= 0 then
    return false;
  end if;

  update public.profiles
     set credits_minutes = credits_minutes + p_minutes
   where id = p_user_id;

  get diagnostics v_found = row_count;
  return v_found;
end;
$$;

revoke all on function public.add_credit_minutes(uuid, numeric) from public;
revoke all on function public.add_credit_minutes(uuid, numeric) from anon;
revoke all on function public.add_credit_minutes(uuid, numeric) from authenticated;
grant execute on function public.add_credit_minutes(uuid, numeric) to service_role;

comment on function public.add_credit_minutes(uuid, numeric) is
  'Ajoute des minutes de crédit de façon atomique. Renvoie false si le profil n''existe pas. service_role uniquement (webhook Stripe).';
