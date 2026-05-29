-- Migration 002 — Profils utilisateurs étendus + table videos
-- À exécuter dans Supabase SQL Editor après la 001_waitlist.
-- Ce schéma pose les fondations du MVP : auth Supabase + table videos
-- avec pipeline status. Les tables Atelier (rewards_ledger, rank_history,
-- referrals) seront ajoutées au Sprint 6 via une migration 003.

-- ─────────────────────────────────────────────────────────────────
-- 1. Profils utilisateurs
-- ─────────────────────────────────────────────────────────────────
-- Supabase auth crée automatiquement auth.users à chaque signup.
-- On crée une table profiles qui étend cette table avec nos colonnes
-- métier (rank Atelier, quota, etc.). Liée 1:1 via auth.users.id.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,

  -- Plan et quota
  plan text not null default 'free'
    check (plan in ('free', 'starter', 'plus', 'credits')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  quota_minutes_total numeric(10,2) not null default 5,    -- essai gratuit 5 min
  quota_minutes_used numeric(10,2) not null default 0,
  quota_reset_at timestamptz,                              -- prochain renouvellement Stripe
  credits_minutes numeric(10,2) not null default 0,        -- minutes from credit packs

  -- Atelier (cf. 03-produit/06-atelier-gamification.md)
  rank text not null default 'apprenti'
    check (rank in ('apprenti', 'correcteur', 'editeur_en_chef', 'maitre_doeuvre')),
  lifetime_minutes_used numeric(10,2) not null default 0,
  subscription_streak_months int not null default 0,
  anniversary_date date,
  referral_code text unique,
  referred_by uuid references public.profiles(id),

  -- Préférences
  delete_after_days int not null default 30
    check (delete_after_days in (7, 14, 30)),
  language text not null default 'fr',
  email_notifications boolean not null default true,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_rank_idx on public.profiles(rank);
create index if not exists profiles_referral_code_idx on public.profiles(referral_code);

-- Trigger : update updated_at sur chaque modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger : créer un profil automatiquement quand un user signup
-- Génère aussi un referral_code unique aléatoire 8 chars.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_code text;
begin
  -- Générer un code referral unique (8 chars alphanumériques)
  loop
    new_code := lower(substring(encode(gen_random_bytes(6), 'base64'), 1, 8));
    -- Replace special chars qui posent problème dans une URL
    new_code := translate(new_code, '+/=', 'xyz');
    exit when not exists (select 1 from public.profiles where referral_code = new_code);
  end loop;

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    referral_code,
    anniversary_date
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new_code,
    current_date
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- 2. Table videos
-- ─────────────────────────────────────────────────────────────────
-- Une ligne par vidéo uploadée. Le pipeline est décrit par status
-- et processing_steps (jsonb). Permet de retrouver précisément à
-- quelle étape une vidéo a échoué.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Métadonnées vidéo
  original_filename text not null,
  duration_seconds numeric(10,2),
  duration_minutes numeric(10,2) generated always as (duration_seconds / 60) stored,
  size_bytes bigint,
  format text,                           -- mp4, mov, avi, mkv, webm
  resolution text,                       -- ex: "1920x1080"

  -- Stockage R2
  storage_key_source text,               -- chemin original dans R2
  storage_key_audio text,                -- audio extrait
  storage_key_srt text,                  -- sous-titres .srt
  storage_key_vtt text,                  -- sous-titres .vtt
  storage_key_burned text,               -- vidéo finale avec sous-titres

  -- Pipeline
  status text not null default 'queued'
    check (status in (
      'queued',
      'extracting_audio',
      'transcribing',
      'translating',
      'aligning',
      'generating_subtitles',
      'burning_in',
      'done',
      'failed',
      'cancelled'
    )),
  processing_steps jsonb not null default '[]'::jsonb,
  error_message text,
  retry_count int not null default 0,

  -- Contenu transcription (cached pour l'éditeur)
  transcription_fr jsonb,                -- array de { start, end, text }
  transcription_en jsonb,                -- array de { start, end, text }
  user_edited boolean not null default false,

  -- Timestamps
  uploaded_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  delete_at timestamptz                  -- suppression auto J+30
);

create index if not exists videos_user_id_idx on public.videos(user_id);
create index if not exists videos_status_idx on public.videos(status);
create index if not exists videos_uploaded_at_idx on public.videos(uploaded_at desc);
create index if not exists videos_delete_at_idx on public.videos(delete_at) where delete_at is not null;

-- ─────────────────────────────────────────────────────────────────
-- 3. Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────────
-- Isolation stricte par utilisateur.

alter table public.profiles enable row level security;
alter table public.videos enable row level security;

-- Profils : un user voit/modifie uniquement son propre profil
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Videos : un user voit/modifie uniquement ses propres vidéos
drop policy if exists "Users can view own videos" on public.videos;
create policy "Users can view own videos" on public.videos
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own videos" on public.videos;
create policy "Users can insert own videos" on public.videos
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own videos" on public.videos;
create policy "Users can update own videos" on public.videos
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own videos" on public.videos;
create policy "Users can delete own videos" on public.videos
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. Helper functions
-- ─────────────────────────────────────────────────────────────────

-- Retourne les minutes restantes pour un user (quota + crédits)
create or replace function public.get_user_minutes_available(user_id uuid)
returns numeric as $$
declare
  q_total numeric;
  q_used numeric;
  c_minutes numeric;
begin
  select quota_minutes_total, quota_minutes_used, credits_minutes
    into q_total, q_used, c_minutes
    from public.profiles
    where id = user_id;

  return greatest(q_total - q_used, 0) + c_minutes;
end;
$$ language plpgsql security definer;

-- Décompte des minutes pour un user. Utilise d'abord le quota mensuel,
-- puis les crédits, dans l'ordre. Retourne true si OK, false si insuffisant.
create or replace function public.consume_user_minutes(user_id uuid, minutes_to_use numeric)
returns boolean as $$
declare
  q_total numeric;
  q_used numeric;
  q_avail numeric;
  c_minutes numeric;
  remaining numeric;
begin
  select quota_minutes_total, quota_minutes_used, credits_minutes
    into q_total, q_used, c_minutes
    from public.profiles
    where id = user_id
    for update;

  q_avail := greatest(q_total - q_used, 0);

  if q_avail + c_minutes < minutes_to_use then
    return false;
  end if;

  remaining := minutes_to_use;

  -- Consomme d'abord le quota mensuel
  if q_avail > 0 then
    if q_avail >= remaining then
      update public.profiles
        set quota_minutes_used = quota_minutes_used + remaining
        where id = user_id;
      return true;
    else
      update public.profiles
        set quota_minutes_used = quota_minutes_used + q_avail
        where id = user_id;
      remaining := remaining - q_avail;
    end if;
  end if;

  -- Puis les crédits
  update public.profiles
    set credits_minutes = credits_minutes - remaining
    where id = user_id;

  return true;
end;
$$ language plpgsql security definer;
