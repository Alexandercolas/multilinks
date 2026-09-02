-- Link limits:
--   Pro  -> 50 active links.
--   Free -> 3 active links during the first 30 days after signup, then 1.
-- Enforcement happens at three points: the insert/update trigger (can't add
-- past the limit), a daily sweep (deactivates the extras once the month ends),
-- and the public profile render (never shows more than the plan allows).

-- 1. How many active links a non-Pro account may keep right now.
create or replace function public.free_link_allowance(target_user uuid)
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when exists (
      select 1 from auth.users
      where id = target_user
        and created_at > now() - interval '30 days'
    ) then 3
    else 1
  end;
$$;

revoke all on function public.free_link_allowance(uuid) from public;
grant execute on function public.free_link_allowance(uuid) to authenticated, service_role;

-- Final active-link limit for a profile (Pro, free trial, or free base). Used by
-- the public profile page to never render more links than the plan allows, even
-- in the window before the daily sweep runs.
create or replace function public.profile_effective_link_limit(target_profile uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.account_has_pro(target_profile) then 50
    else public.free_link_allowance(target_profile)
  end;
$$;

revoke all on function public.profile_effective_link_limit(uuid) from public;
grant execute on function public.profile_effective_link_limit(uuid) to anon, authenticated, service_role;

-- 2. Block inserts / activations that would exceed the current allowance.
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
    when public.account_has_pro(new.profile_id) then 50
    else public.free_link_allowance(new.profile_id)
  end;

  if active_count >= active_limit then
    raise exception using
      errcode = 'P0001',
      message = case
        when active_limit = 50 then 'El plan Pro permite hasta 50 enlaces activos'
        when active_limit = 3 then 'El plan Gratis permite 3 enlaces activos durante el primer mes. Activa Pro para hasta 50.'
        else 'El plan Gratis permite 1 enlace activo. Activa Pro para hasta 50.'
      end;
  end if;

  return new;
end;
$$;

-- 3. Daily sweep: once the free month is over, keep only the first active link.
create or replace function public.enforce_expired_free_link_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  with ranked as (
    select l.id,
           row_number() over (
             partition by l.profile_id
             order by l.position asc, l.created_at asc
           ) as rn
    from public.links l
    join auth.users u on u.id = l.profile_id
    where l.active = true
      and u.created_at <= now() - interval '30 days'
      and not public.account_has_pro(l.profile_id)
  )
  update public.links
  set active = false
  where id in (select id from ranked where rn > 1);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.enforce_expired_free_link_limits() from public, anon, authenticated;
grant execute on function public.enforce_expired_free_link_limits() to service_role;

-- 4. Run the sweep every day at 03:17 UTC.
create extension if not exists pg_cron;
select cron.schedule(
  'enforce-free-link-limits',
  '17 3 * * *',
  $$select public.enforce_expired_free_link_limits()$$
);

-- 5. Catalog copy shown on /planes and in the Pro welcome message.
update public.plans
set features = '["3 enlaces activos el primer mes (luego 1)", "Personalización básica", "Estadísticas de visitas y clics"]'::jsonb
where id = 'free';

update public.plans
set price_monthly = 350,
    features = '["Hasta 50 enlaces activos", "Miniaturas de YouTube", "Imagen de fondo propia", "Todos los temas premium", "Sin marca MultiLinks", "Soporte prioritario"]'::jsonb
where id = 'pro';
