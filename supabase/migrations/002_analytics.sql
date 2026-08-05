create table if not exists public.profile_daily_views (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0 check (views >= 0),
  primary key (profile_id, day)
);

alter table public.profile_daily_views enable row level security;
drop policy if exists "Users view their analytics" on public.profile_daily_views;
create policy "Users view their analytics" on public.profile_daily_views
for select using (auth.uid() = profile_id);

create or replace function public.record_profile_view(target_profile uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where id = target_profile and published = true) then
    insert into public.profile_daily_views (profile_id, day, views)
    values (target_profile, current_date, 1)
    on conflict (profile_id, day) do update set views = profile_daily_views.views + 1;
  end if;
end;
$$;

create or replace function public.record_link_click(target_link uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare destination text;
begin
  update public.links
  set clicks = clicks + 1
  where id = target_link and active = true and exists (
    select 1 from public.profiles where profiles.id = links.profile_id and profiles.published = true
  )
  returning url into destination;
  return destination;
end;
$$;

revoke all on function public.record_profile_view(uuid) from public;
revoke all on function public.record_link_click(uuid) from public;
grant execute on function public.record_profile_view(uuid) to anon, authenticated;
grant execute on function public.record_link_click(uuid) to anon, authenticated;
