-- Migration 004 — Durcissement sécurité des fonctions (advisor Supabase)
--
-- 1. Fixer le search_path des helpers (function_search_path_mutable)
-- 2. Révoquer EXECUTE pour anon/authenticated/public sur les fonctions
--    SECURITY DEFINER. Elles ne doivent être appelées que :
--      - par les triggers (handle_new_user, handle_updated_at)
--      - côté serveur via service_role (consume_user_minutes, get_user_minutes_available)
--    Sans cette révocation, un user authentifié pourrait appeler
--    consume_user_minutes(autre_user_id, ...) via /rest/v1/rpc et drainer
--    les minutes d'un autre compte (la fonction bypass RLS car security definer).

create or replace function public.get_user_minutes_available(p_user_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  q_total numeric;
  q_used numeric;
  c_minutes numeric;
begin
  select quota_minutes_total, quota_minutes_used, credits_minutes
    into q_total, q_used, c_minutes
    from public.profiles
    where id = p_user_id;
  return greatest(q_total - q_used, 0) + c_minutes;
end;
$$;

create or replace function public.consume_user_minutes(p_user_id uuid, minutes_to_use numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
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
    where id = p_user_id
    for update;
  q_avail := greatest(q_total - q_used, 0);
  if q_avail + c_minutes < minutes_to_use then
    return false;
  end if;
  remaining := minutes_to_use;
  if q_avail > 0 then
    if q_avail >= remaining then
      update public.profiles set quota_minutes_used = quota_minutes_used + remaining where id = p_user_id;
      return true;
    else
      update public.profiles set quota_minutes_used = quota_minutes_used + q_avail where id = p_user_id;
      remaining := remaining - q_avail;
    end if;
  end if;
  update public.profiles set credits_minutes = credits_minutes - remaining where id = p_user_id;
  return true;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.get_user_minutes_available(uuid) from public, anon, authenticated;
revoke execute on function public.consume_user_minutes(uuid, numeric) from public, anon, authenticated;
