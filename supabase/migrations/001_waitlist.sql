-- Migration 001 — Table waitlist
-- À exécuter dans Supabase SQL Editor après création du projet

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  ip_hash text,
  user_agent text,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  notified_at timestamptz,
  notes text
);

-- Index pour recherches rapides
create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_subscribed_at_idx on public.waitlist(subscribed_at desc);

-- RLS (sécurité)
alter table public.waitlist enable row level security;

-- Personne ne peut lire la table sauf via la service_role_key (côté serveur)
-- Aucune policy en SELECT pour les utilisateurs anonymes ou authentifiés
-- → Seule notre API serveur (avec service_role_key) peut lire/écrire
