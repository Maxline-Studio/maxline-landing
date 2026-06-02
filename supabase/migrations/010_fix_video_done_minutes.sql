-- Fix : en BEFORE UPDATE, les colonnes générées (duration_minutes) ne sont pas
-- encore calculées dans NEW. On calcule donc depuis duration_seconds.
create or replace function public.handle_video_done()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $$
begin
  if new.status = 'done'
     and old.status is distinct from 'done'
     and new.lifetime_counted = false then
    update public.profiles
      set lifetime_minutes_used =
            lifetime_minutes_used + coalesce(new.duration_seconds, 0) / 60.0
      where id = new.user_id;
    new.lifetime_counted := true;
  end if;
  return new;
end;
$$;
