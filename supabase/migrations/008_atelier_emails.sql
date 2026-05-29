-- Migration 008 — Emails de bonus / progression Atelier (pont DB → email)
--
-- Les bonus de minutes (streak, anniversaire, cadeau, parrainage) passent tous
-- par grant_bonus_minutes(), et les promotions de rang par handle_rank_recalc().
-- On y ajoute un appel pg_net (asynchrone, non bloquant) vers un endpoint interne
-- (/api/internal/atelier-email) qui envoie l'email via Resend.
--
-- L'URL et le secret partagé sont lus depuis private.app_config (schéma NON
-- exposé par l'API). Le secret n'est PAS dans ce fichier (repo public) : il est
-- inséré hors-commit (même valeur que CRON_SECRET côté Vercel). Tant que le
-- secret est absent, l'appel email est simplement ignoré (garde-fou).

-- pg_net dans le schéma `extensions` (pas public — évite l'advisor extension_in_public).
create extension if not exists pg_net with schema extensions;

-- Config privée (URL + secret), inaccessible via l'API REST.
create schema if not exists private;
create table if not exists private.app_config (
  key text primary key,
  value text not null
);

insert into private.app_config (key, value)
values ('atelier_email_url', 'https://www.maxlinestudio.fr/api/internal/atelier-email')
on conflict (key) do update set value = excluded.value;
-- NB : la clé 'atelier_email_secret' est insérée hors-commit (voir déploiement).

-- ─────────────────────────────────────────────────────────────────
-- grant_bonus_minutes : crédite + journalise + notifie par email.
-- ─────────────────────────────────────────────────────────────────
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
declare
  v_url text;
  v_secret text;
begin
  if p_minutes <= 0 then
    return;
  end if;

  update public.profiles
    set credits_minutes = credits_minutes + p_minutes
    where id = p_user_id;

  insert into public.rewards_ledger(user_id, type, minutes_bonus, reason)
    values (p_user_id, p_type, p_minutes, p_reason);

  -- Notification email (async, non bloquant). Ignorée si secret absent.
  select value into v_url from private.app_config where key = 'atelier_email_url';
  select value into v_secret from private.app_config where key = 'atelier_email_secret';
  if v_url is not null and v_secret is not null then
    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_secret
      ),
      body := jsonb_build_object(
        'user_id', p_user_id,
        'type', p_type,
        'minutes', p_minutes,
        'reason', p_reason
      )
    );
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- handle_rank_recalc : recalcul du rang + email à la PROMOTION uniquement.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.handle_rank_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  computed text;
  v_url text;
  v_secret text;
  v_ranks text[] := array['apprenti', 'correcteur', 'editeur_en_chef', 'maitre_doeuvre'];
begin
  computed := public.compute_rank(new.lifetime_minutes_used);
  if computed is distinct from new.rank then
    insert into public.rank_history(user_id, from_rank, to_rank)
      values (new.id, new.rank, computed);

    -- Email seulement si c'est une montée de rang (pas une correction descendante).
    if array_position(v_ranks, computed) > array_position(v_ranks, new.rank) then
      select value into v_url from private.app_config where key = 'atelier_email_url';
      select value into v_secret from private.app_config where key = 'atelier_email_secret';
      if v_url is not null and v_secret is not null then
        perform net.http_post(
          url := v_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_secret
          ),
          body := jsonb_build_object(
            'user_id', new.id,
            'type', 'rank_promotion',
            'to_rank', computed
          )
        );
      end if;
    end if;

    new.rank := computed;
  end if;
  return new;
end;
$$;

-- Les EXECUTE restent révoqués (CREATE OR REPLACE conserve les privilèges ;
-- on réaffirme par sécurité).
revoke execute on function public.grant_bonus_minutes(uuid, numeric, text, text) from public, anon, authenticated;
