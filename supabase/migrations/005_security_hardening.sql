create table if not exists public.analytics_rate_limits (
  event_key text primary key,
  window_started timestamptz not null default now(),
  hit_count integer not null default 1
);
alter table public.analytics_rate_limits enable row level security;

create or replace function public.check_analytics_rate_limit(target_key text, max_hits integer, window_seconds integer)
returns boolean language plpgsql security definer set search_path = public
as $$
declare allowed boolean;
begin
  insert into public.analytics_rate_limits (event_key, window_started, hit_count)
  values (target_key, now(), 1)
  on conflict (event_key) do update set
    window_started = case when analytics_rate_limits.window_started < now() - make_interval(secs => window_seconds) then now() else analytics_rate_limits.window_started end,
    hit_count = case when analytics_rate_limits.window_started < now() - make_interval(secs => window_seconds) then 1 else analytics_rate_limits.hit_count + 1 end
  returning hit_count <= max_hits into allowed;
  return allowed;
end;
$$;

create or replace function public.public_link_destination(target_link uuid)
returns text language sql stable security definer set search_path = public
as $$
  select links.url from public.links
  join public.profiles on profiles.id = links.profile_id
  where links.id = target_link and links.active = true and profiles.published = true
$$;

revoke all on function public.record_profile_view(uuid) from public, anon, authenticated;
revoke all on function public.record_link_click(uuid) from public, anon, authenticated;
revoke all on function public.check_analytics_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.public_link_destination(uuid) from public, anon, authenticated;
grant execute on function public.record_profile_view(uuid) to service_role;
grant execute on function public.record_link_click(uuid) to service_role;
grant execute on function public.check_analytics_rate_limit(text, integer, integer) to service_role;
grant execute on function public.public_link_destination(uuid) to service_role;
