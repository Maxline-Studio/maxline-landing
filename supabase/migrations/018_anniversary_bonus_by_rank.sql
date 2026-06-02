-- Bonus anniversaire désormais fonction du rang (cohérence avec les perks
-- annoncés). Remplace l'ancien « un mois gratuit » du Maître d'œuvre (jamais
-- implémenté, et incohérent avec la philo « bonus en minutes, pas en argent »)
-- par un bonus de minutes généreux. Coût quasi nul (~0,015 €/min), tenable.
--   apprenti 10 · correcteur 20 · éditeur en chef 50 · maître d'œuvre 200
create or replace function public.cron_anniversary_daily()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_bonus numeric;
begin
  for r in
    select id, rank from public.profiles
      where anniversary_date is not null
        and to_char(anniversary_date, 'MM-DD') = to_char(current_date, 'MM-DD')
        and anniversary_date < current_date
        and not exists (
          select 1 from public.rewards_ledger l
          where l.user_id = profiles.id
            and l.type = 'anniversary'
            and l.created_at >= date_trunc('year', now())
        )
  loop
    v_bonus := case r.rank
      when 'maitre_doeuvre' then 200
      when 'editeur_en_chef' then 50
      when 'correcteur' then 20
      else 10
    end;
    perform public.grant_bonus_minutes(
      r.id, v_bonus, 'anniversary', 'Anniversaire d''inscription');
  end loop;
end;
$$;
