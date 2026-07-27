-- 028_rls_initplan.sql
-- Suite de l'audit — corrections remontées par le linter Supabase (2026-07-27).
--
-- 1. RLS : `auth.uid()` évalué UNE SEULE FOIS par requête, pas une fois par ligne
-- 2. Index manquant sur une clé étrangère
-- 3. Suppression de deux index jamais utilisés
--
-- ─────────────────────────────────────────────────────────────────
-- 1. auth.uid() → (select auth.uid())
-- ─────────────────────────────────────────────────────────────────
-- Appelé nu dans une policy, `auth.uid()` est une fonction STABLE que Postgres
-- peut réévaluer POUR CHAQUE LIGNE examinée. Enveloppé dans un sous-select, il
-- devient un InitPlan : calculé une fois, puis comparé comme une constante.
-- La sémantique est strictement identique — seul le plan d'exécution change.
--
-- La migration 026 avait déjà appliqué ce correctif à `video_subtitles` ; le
-- linter a montré que les policies plus anciennes (profiles, videos, glossaries,
-- rewards_ledger, rank_history, referrals) avaient le même défaut. Sur la liste
-- « Mes vidéos » d'un compte chargé, c'est autant d'appels évités.

-- ── profiles ──
alter policy "Users can view own profile" on public.profiles
  using ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── videos ──
alter policy "Users can view own videos" on public.videos
  using ((select auth.uid()) = user_id);
alter policy "Users can insert own videos" on public.videos
  with check ((select auth.uid()) = user_id);
alter policy "Users can update own videos" on public.videos
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "Users can delete own videos" on public.videos
  using ((select auth.uid()) = user_id);

-- ── glossaries ──
alter policy "glossaries_select_own" on public.glossaries
  using ((select auth.uid()) = user_id);
alter policy "glossaries_insert_own" on public.glossaries
  with check ((select auth.uid()) = user_id);
alter policy "glossaries_update_own" on public.glossaries
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy "glossaries_delete_own" on public.glossaries
  using ((select auth.uid()) = user_id);

-- ── Atelier (lecture seule) ──
alter policy "Users read own rewards" on public.rewards_ledger
  using ((select auth.uid()) = user_id);
alter policy "Users read own rank history" on public.rank_history
  using ((select auth.uid()) = user_id);
alter policy "Users read own referrals" on public.referrals
  using (((select auth.uid()) = inviter_id) or ((select auth.uid()) = invitee_id));

-- ─────────────────────────────────────────────────────────────────
-- 2. Clé étrangère sans index
-- ─────────────────────────────────────────────────────────────────
-- `profiles.referred_by` référence `profiles.id`. Sans index, chaque suppression
-- de profil impose un balayage complet de la table pour vérifier la contrainte,
-- et la recherche des filleuls d'un parrain est linéaire.
create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by)
  where referred_by is not null;

-- ─────────────────────────────────────────────────────────────────
-- 3. Index jamais utilisés
-- ─────────────────────────────────────────────────────────────────
-- Créés « au cas où » à la migration 002/006, jamais lus depuis. Un index inutile
-- n'est pas neutre : il ralentit chaque écriture et occupe de l'espace.
-- (`videos_heartbeat_idx`, créé en 026, apparaît aussi comme inutilisé — c'est
-- normal, le stale-reaper ne l'a pas encore sollicité. On le garde.)
drop index if exists public.profiles_rank_idx;
drop index if exists public.referrals_status_idx;
