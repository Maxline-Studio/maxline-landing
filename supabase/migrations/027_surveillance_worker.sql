-- 027_surveillance_worker.sql
-- Surveillance du worker TOUTES LES 10 MINUTES, depuis Postgres lui-même.
--
-- POURQUOI PAS VERCEL : le palier Hobby limite les crons à UNE exécution par
-- jour. Si le worker tombe à 9 h, l'alerte partait au plus tôt le lendemain —
-- jusqu'à 23 heures pendant lesquelles chaque upload consomme les minutes d'un
-- client sans rien produire.
--
-- POURQUOI PAS GITHUB ACTIONS : ça marcherait, mais il faut élargir les droits
-- du jeton d'accès. Ici, tout vit dans la base : rien à installer, aucun compte
-- supplémentaire, et la surveillance tourne au plus près des données.
--
-- MÉCANIQUE : pg_cron appelle /api/cron/health toutes les 10 minutes via pg_net.
-- L'endpoint fait le diagnostic (backlog de vidéos en attente + battement de
-- cœur du worker) et envoie l'e-mail d'alerte via Resend s'il y a un problème.
-- Le secret d'appel est lu dans le Vault Supabase — jamais écrit en clair ici.
--
-- ⚠️ PRÉREQUIS : le secret `cron_secret` doit exister dans le Vault. Il est créé
-- par un fichier séparé, volontairement gardé HORS du dépôt Git puisqu'il
-- contient la valeur du secret.
--
-- NB (correctif du 2026-07-26) : la première version appelait
-- `extensions.http_get` en dur. Selon la façon dont pg_net a été activé, ses
-- fonctions vivent dans `extensions`, dans `net` ou ailleurs — l'appel échouait
-- silencieusement dans le job planifié. Le schéma est désormais RÉSOLU À
-- L'EXÉCUTION, ce qui rend la sonde insensible à ce détail d'installation.

-- ─────────────────────────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────────
-- 2. La sonde
-- ─────────────────────────────────────────────────────────────────
-- Appel non bloquant (pg_net poste la requête dans une file interne et rend la
-- main immédiatement). On ne lit pas la réponse : c'est l'endpoint qui alerte.
create or replace function public.ping_worker_health()
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_secret text;
  v_schema text;
  v_url    text := 'https://www.maxlinestudio.fr/api/cron/health';
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
   where name = 'cron_secret'
   limit 1;

  if v_secret is null then
    return 'ERREUR : secret « cron_secret » absent du Vault — surveillance inactive.';
  end if;

  -- Où vivent les fonctions de pg_net ? (`extensions`, `net`… selon l'activation)
  select n.nspname into v_schema
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where p.proname = 'http_get'
   order by case n.nspname when 'net' then 1 when 'extensions' then 2 else 3 end
   limit 1;

  if v_schema is null then
    return 'ERREUR : pg_net introuvable (fonction http_get absente).';
  end if;

  execute format(
    'select %I.http_get(url := $1, headers := $2, timeout_milliseconds := 20000)',
    v_schema
  ) using v_url, jsonb_build_object('Authorization', 'Bearer ' || v_secret);

  return 'OK — appel posté via ' || v_schema || '.http_get';
end;
$$;

revoke all on function public.ping_worker_health() from public, anon, authenticated;

comment on function public.ping_worker_health() is
  'Appelle /api/cron/health (qui alerte par e-mail en cas de panne). Planifié par pg_cron toutes les 10 min.';

-- ─────────────────────────────────────────────────────────────────
-- 3. Planification
-- ─────────────────────────────────────────────────────────────────
-- Idempotent : on retire l'ancienne planification avant d'en poser une neuve.
select cron.unschedule('maxline-health')
  where exists (select 1 from cron.job where jobname = 'maxline-health');

select cron.schedule(
  'maxline-health',
  '*/10 * * * *',
  $$select public.ping_worker_health();$$
);

-- ─────────────────────────────────────────────────────────────────
-- Vérification (à lancer après coup)
-- ─────────────────────────────────────────────────────────────────
--   select public.ping_worker_health();            -- doit renvoyer « OK — … »
--   select jobname, schedule, active from cron.job;
--   select status, return_message, start_time
--     from cron.job_run_details
--    where jobname = 'maxline-health'
--    order by start_time desc limit 5;
