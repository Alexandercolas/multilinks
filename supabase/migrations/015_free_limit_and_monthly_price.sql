-- Align the database-enforced free tier and displayed catalog price with the
-- current MultiLinks offer: five active links and US$3.50/month for Pro.

create or replace function public.enforce_free_link_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  active_limit integer;
begin
  if new.active is not true then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.profile_id::text, 0));

  select count(*) into active_count
  from public.links
  where profile_id = new.profile_id
    and active = true
    and id <> new.id;

  active_limit := case
    when public.account_has_pro(new.profile_id) then 100
    else 5
  end;

  if active_count >= active_limit then
    raise exception using
      errcode = 'P0001',
      message = case
        when active_limit = 100 then 'El plan Pro permite hasta 100 enlaces activos'
        else 'El plan Gratis permite hasta 5 enlaces activos'
      end;
  end if;

  return new;
end;
$$;

update public.plans
set
  features = '["Hasta 5 enlaces activos", "Personalización básica", "Estadísticas generales"]'::jsonb
where id = 'free';

update public.plans
set
  price_monthly = 350,
  features = '["Hasta 100 enlaces activos", "Estadísticas completas", "Temas premium", "Sin marca MultiLinks", "Soporte prioritario"]'::jsonb
where id = 'pro';
