-- 015_profiles_column_privileges.sql
-- Faille corrigée : la policy RLS « update own profile » (auth.uid() = id) laissait
-- l'utilisateur modifier N'IMPORTE QUELLE colonne de son propre profil — dont
-- credits_minutes, quota_minutes_used, quota_minutes_total, plan, rank,
-- lifetime_minutes_used, stripe_*… Un utilisateur pouvait donc, via un appel direct
-- à l'API REST (son token + la clé anon publique), se créditer des minutes illimitées.
--
-- Correctif : privilèges au niveau COLONNE. Le rôle `authenticated` ne peut plus
-- modifier que ses préférences. Les colonnes sensibles ne sont modifiables que par
-- le service_role (webhook Stripe, server actions admin) et les fonctions
-- SECURITY DEFINER (qui s'exécutent en tant que propriétaire) — non concernés par
-- ce grant. La policy RLS (ligne = la sienne) reste en place et se cumule.

revoke update on public.profiles from anon, authenticated;

grant update (
  display_name,
  avatar_url,
  email_notifications,
  delete_after_days,
  language
) on public.profiles to authenticated;
