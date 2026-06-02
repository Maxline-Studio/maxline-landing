-- Glossaire personnalisé (perk rang Correcteur+). L'utilisateur impose la
-- traduction d'un terme : source_term → target_term, pour un couple de langues.
-- Injecté par le worker dans le prompt de traduction (translate.ts accepte déjà
-- un paramètre glossary).
create table if not exists public.glossaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_term text not null check (char_length(source_term) between 1 and 120),
  target_term text not null check (char_length(target_term) between 1 and 200),
  source_lang text not null default 'fr' check (source_lang in ('fr','en')),
  target_lang text not null default 'en' check (target_lang in ('fr','en')),
  created_at timestamptz not null default now(),
  -- Un même terme source ne peut avoir qu'un rendu par couple de langues.
  unique (user_id, source_lang, target_lang, source_term)
);

alter table public.glossaries enable row level security;

-- L'utilisateur gère uniquement ses propres entrées (CRUD).
create policy "glossaries_select_own" on public.glossaries
  for select using (auth.uid() = user_id);
create policy "glossaries_insert_own" on public.glossaries
  for insert with check (auth.uid() = user_id);
create policy "glossaries_update_own" on public.glossaries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "glossaries_delete_own" on public.glossaries
  for delete using (auth.uid() = user_id);

create index if not exists glossaries_user_lang_idx
  on public.glossaries (user_id, source_lang, target_lang);
