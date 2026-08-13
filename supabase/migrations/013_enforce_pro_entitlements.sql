-- Enforce paid-plan entitlements at the database boundary. RLS still controls
-- ownership; these triggers validate the business rules even when a user calls
-- the Supabase API directly instead of using the dashboard.

create or replace function public.account_has_pro(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = target_user)
    or exists (
      select 1
      from public.subscriptions
      where user_id = target_user
        and plan_id = 'pro'
        and status in ('active', 'trialing')
    );
$$;

revoke all on function public.account_has_pro(uuid) from public;
grant execute on function public.account_has_pro(uuid) to authenticated, service_role;

create or replace function public.enforce_free_link_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
begin
  if new.active is not true or public.account_has_pro(new.profile_id) then
    return new;
  end if;

  -- Serialize active-link writes per profile so concurrent requests cannot both
  -- pass the count check and exceed the limit.
  perform pg_advisory_xact_lock(hashtextextended(new.profile_id::text, 0));

  select count(*) into active_count
  from public.links
  where profile_id = new.profile_id
    and active = true
    and id <> new.id;

  if active_count >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'El plan Gratis permite hasta 10 enlaces activos';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_link_limit_trigger on public.links;
create trigger enforce_free_link_limit_trigger
before insert or update of active, profile_id on public.links
for each row execute function public.enforce_free_link_limit();

create or replace function public.enforce_profile_pro_features()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.theme = 'neon' or new.background_color like 'preset:%')
    and not public.account_has_pro(new.id) then
    raise exception using
      errcode = 'P0001',
      message = 'Los temas y fondos premium son exclusivos de MultiLinks Pro';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_pro_features_trigger on public.profiles;
create trigger enforce_profile_pro_features_trigger
before insert or update of theme, background_color on public.profiles
for each row execute function public.enforce_profile_pro_features();
