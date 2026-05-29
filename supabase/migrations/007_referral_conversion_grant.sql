-- Migration 007 — Autorise le webhook Stripe (service_role) à valider un parrainage
--
-- process_referral_conversion / grant_bonus_minutes sont SECURITY DEFINER avec
-- EXECUTE révoqué pour public/anon/authenticated (Sprint 6). Le webhook Stripe
-- tourne avec la clé service_role : on lui accorde explicitement l'EXECUTE sur
-- la conversion de parrainage (appelée à la 1re souscription payante).

grant execute on function public.process_referral_conversion(uuid) to service_role;
