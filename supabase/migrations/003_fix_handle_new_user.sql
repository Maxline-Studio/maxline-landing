-- Migration 003 — Fix handle_new_user + search_path
--
-- Bug détecté au Sprint 1 (test live signup) : la fonction handle_new_user
-- utilisait gen_random_bytes() qui appartient à l'extension pgcrypto (schéma
-- `extensions`), inaccessible depuis le search_path d'une fonction security
-- definer. Résultat : "Database error saving new user" à chaque inscription.
--
-- Fix : générer le referral_code depuis gen_random_uuid() (fonction core),
-- et fixer le search_path explicitement (= public) — ce qui satisfait aussi
-- l'advisor sécurité Supabase (function_search_path_mutable).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
begin
  loop
    -- 8 caractères hex depuis un uuid (fonction core, pas pgcrypto)
    new_code := substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    exit when not exists (select 1 from public.profiles where referral_code = new_code);
  end loop;

  insert into public.profiles (id, email, display_name, avatar_url, referral_code, anniversary_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new_code,
    current_date
  );
  return new;
end;
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
