alter table public.profiles
  drop constraint if exists profiles_theme_check;

alter table public.profiles
  add constraint profiles_theme_check
  check (theme in ('lime', 'violet', 'sunset', 'neon'));

create or replace function public.profile_has_pro(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = target_profile)
    or exists (
      select 1 from public.subscriptions
      where user_id = target_profile
        and plan_id = 'pro'
        and status in ('active', 'trialing')
    );
$$;

revoke all on function public.profile_has_pro(uuid) from public;
grant execute on function public.profile_has_pro(uuid) to anon, authenticated, service_role;
