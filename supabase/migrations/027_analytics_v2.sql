-- Additive: legacy counters remain authoritative for the old dashboard.
create table if not exists public.analytics_sessions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null,
  visitor_id uuid not null,
  viewed boolean not null default false,
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  device text not null, browser text not null, os text not null,
  country text not null default 'Unknown', source text not null default 'Direct',
  utm jsonb not null default '{}',
  primary key (profile_id, session_id)
);
create index if not exists analytics_sessions_range on public.analytics_sessions(profile_id, started_at, visitor_id);
create index if not exists analytics_sessions_live on public.analytics_sessions(profile_id, last_seen);
create table if not exists public.analytics_hourly (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hour timestamptz not null,
  link_id uuid not null,
  provider text not null default '', content_type text not null default '',
  clicks bigint not null default 0, plays bigint not null default 0,
  primary key(profile_id, hour, link_id)
);
alter table public.analytics_sessions enable row level security;
alter table public.analytics_hourly enable row level security;
-- No direct client access: both reads and writes go through authorized functions.
create table if not exists public.analytics_link_views (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null, link_id uuid not null,
  seen_at timestamptz not null default now(),
  primary key(profile_id,session_id,link_id)
);
alter table public.analytics_link_views enable row level security;
create index if not exists analytics_link_views_range on public.analytics_link_views(profile_id,seen_at,link_id);
create table if not exists public.analytics_configuration (
  singleton boolean primary key default true check(singleton),
  activated_at timestamptz not null default now()
);
alter table public.analytics_configuration enable row level security;
insert into public.analytics_configuration(singleton) values(true) on conflict do nothing;

create table if not exists public.analytics_campaign_hourly (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hour timestamptz not null, campaign text not null, clicks bigint not null default 0,
  primary key(profile_id,hour,campaign)
);
alter table public.analytics_campaign_hourly enable row level security;
create or replace function public.record_analytics_event(p_profile uuid, p_link uuid, p_kind text, p_context jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid; sid uuid; vid uuid;
begin
  if p_kind not in ('page_view','link_click','media_play','heartbeat','link_views') then return; end if;
  pid := p_profile;
  if p_link is not null then
    select profile_id into pid from public.links where id=p_link and active;
  end if;
  if (p_profile is not null and pid<>p_profile) or pid is null or not public.profile_is_available(pid) then return; end if;
  if p_link is not null and not public.link_is_published(p_link) then return; end if;
  if p_kind='media_play' and not public.account_has_pro(pid) then return; end if;
  sid := (p_context->>'session')::uuid; vid := (p_context->>'visitor')::uuid;
  if sid is null or vid is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended(pid::text || sid::text, 0));
  if p_kind='heartbeat' then
    update public.analytics_sessions set last_seen=now() where profile_id=pid and session_id=sid;
    return;
  end if;
  insert into public.analytics_sessions(profile_id,session_id,visitor_id,viewed,device,browser,os,country,source,utm)
  values(pid,sid,vid,p_kind='page_view',coalesce(p_context->>'device','Other'),coalesce(p_context->>'browser','Other'),
    coalesce(p_context->>'os','Other'),'Unknown',coalesce(p_context->>'source','Direct'),coalesce(p_context->'utm','{}'))
  on conflict(profile_id,session_id) do update set last_seen=now(),
    source=case when not analytics_sessions.viewed and excluded.viewed then excluded.source else analytics_sessions.source end,
    utm=case when not analytics_sessions.viewed and excluded.viewed then excluded.utm else analytics_sessions.utm end,
    viewed=analytics_sessions.viewed or excluded.viewed;
  if p_kind='link_click' then
    insert into public.analytics_campaign_hourly(profile_id,hour,campaign,clicks)
    select pid,date_trunc('hour',now()),utm->>'utm_campaign',1 from public.analytics_sessions
    where profile_id=pid and session_id=sid and utm ? 'utm_campaign'
    on conflict(profile_id,hour,campaign) do update set clicks=analytics_campaign_hourly.clicks+1;
  end if;
  if p_kind='link_views' then
    with inserted as (
      insert into public.analytics_link_views(profile_id,session_id,link_id)
      select pid,sid,l.id from jsonb_array_elements_text(p_context->'links') x(id)
      join public.links l on l.id=x.id::uuid and l.profile_id=pid and l.active and public.link_is_published(l.id)
      on conflict do nothing returning link_id
    )
    insert into public.analytics_hourly(profile_id,hour,link_id,provider,content_type)
    select pid,date_trunc('hour',now()),l.id,coalesce(l.provider,''),coalesce(l.metadata->>'contentType',case
      when l.provider in ('spotify','applemusic','deezer') and l.url ~ '/playlist/' then 'playlist'
      when l.provider in ('spotify','applemusic','deezer') and l.url ~ '/album/' then 'album'
      when l.provider in ('spotify','applemusic','deezer') and l.url ~ '/track/' then 'track'
      when l.provider in ('youtube','vimeo','tiktok') then 'video'
      else coalesce(l.link_type,'standard') end)
    from inserted i join public.links l on l.id=i.link_id
    on conflict do nothing;
  end if;
  if p_link is not null and p_kind in ('link_click','media_play') then
    insert into public.analytics_hourly(profile_id,hour,link_id,provider,content_type,clicks,plays)
    select pid,date_trunc('hour',now()),id,coalesce(provider,''),coalesce(metadata->>'contentType', case
        when provider in ('spotify','applemusic','deezer') and url ~ '/playlist/' then 'playlist'
        when provider in ('spotify','applemusic','deezer') and url ~ '/album/' then 'album'
        when provider in ('spotify','applemusic','deezer') and url ~ '/track/' then 'track'
        when provider in ('youtube','vimeo','tiktok') then 'video'
        else coalesce(link_type,'standard') end),
      case when p_kind='link_click' then 1 else 0 end,case when p_kind='media_play' then 1 else 0 end
    from public.links where id=p_link
    on conflict(profile_id,hour,link_id) do update set clicks=analytics_hourly.clicks+excluded.clicks, plays=analytics_hourly.plays+excluded.plays;
  end if;
end $$;
revoke all on function public.record_analytics_event(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_analytics_event(uuid,uuid,text,jsonb) to service_role;

create or replace function public.analytics_report(p_start timestamptz,p_end timestamptz,p_timezone text default 'UTC')
returns jsonb language plpgsql security definer set search_path=public as $$
declare pid uuid:=auth.uid(); pro boolean; result jsonb; duration interval;
begin
  if pid is null then raise exception 'Unauthorized'; end if;
  pro:=public.account_has_pro(pid); duration:=p_end-p_start;
  if duration<=interval '0' or duration>interval '90 days' or p_end>now()+interval '1 day'
    or p_start<date_trunc('hour',now())-(case when pro then interval '180 days' else interval '7 days' end)
    or (not pro and duration>interval '7 days') then raise exception 'Invalid range'; end if;
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone'; end if;
  with periods as (
    select 'current' name,p_start a,p_end b union all select 'previous',p_start-duration,p_start where pro
  ), totals as (
    select name,count(s.session_id) visits,count(distinct s.visitor_id) visitors,
      (select coalesce(sum(h.clicks),0) from public.analytics_hourly h where h.profile_id=pid and h.hour>=a and h.hour<b) clicks
    from periods left join public.analytics_sessions s on s.profile_id=pid and s.viewed and s.started_at>=a and s.started_at<b group by name,a,b
  ), timeline as (
    select bucket,
      (select count(*) from public.analytics_sessions s where s.profile_id=pid and s.viewed and s.started_at>=bucket_start and s.started_at<bucket_end) visits,
      (select count(distinct visitor_id) from public.analytics_sessions s where s.profile_id=pid and s.viewed and s.started_at>=bucket_start and s.started_at<bucket_end) visitors,
      (select coalesce(sum(clicks),0) from public.analytics_hourly h where h.profile_id=pid and h.hour>=bucket_start and h.hour<bucket_end) clicks
    from (
      select bucket,greatest(bucket,p_start) bucket_start,
        least(coalesce(lead(bucket) over(order by bucket),p_end),p_end) bucket_end
      from (
        select case when duration<=interval '1 day' then wall_time at time zone 'UTC' else wall_time at time zone p_timezone end bucket
        from generate_series(
          case when duration<=interval '1 day' then date_trunc('hour',p_start at time zone 'UTC') else date_trunc('day',p_start at time zone p_timezone) end,
          case when duration<=interval '1 day' then p_end at time zone 'UTC' else p_end at time zone p_timezone end,
          case when duration<=interval '1 day' then interval '1 hour' else interval '1 day' end) wall_time
      ) calendar where bucket<p_end
    ) buckets
  ), link_totals as (
    select h.link_id id,coalesce(l.title,'Enlace eliminado') title,l.url,h.provider,h.content_type,
      sum(h.clicks) clicks,sum(h.plays) plays,
      (select count(*) from public.analytics_link_views v where v.profile_id=pid and v.link_id=h.link_id and v.seen_at>=p_start and v.seen_at<p_end) views
    from public.analytics_hourly h left join public.links l on l.id=h.link_id
    where h.profile_id=pid and h.hour>=p_start and h.hour<p_end
    group by h.link_id,l.title,l.url,h.provider,h.content_type order by sum(h.clicks) desc
  ), sessions as (
    select * from public.analytics_sessions where profile_id=pid and viewed and started_at>=p_start and started_at<p_end
  ), dimensions as (
    select 'devices' dimension,device label,count(*) count from sessions group by device
    union all select 'browsers',browser,count(*) from sessions group by browser
    union all select 'systems',os,count(*) from sessions group by os
    union all select 'countries',country,count(*) from sessions group by country
    union all select 'sources',source,count(*) from sessions group by source
    union all select 'hours',extract(hour from started_at at time zone p_timezone)::text,count(*) from sessions group by 2
    union all select 'weekdays',extract(isodow from started_at at time zone p_timezone)::text,count(*) from sessions group by 2
  ) select jsonb_build_object(
    'comparisonAvailable',pro and p_start-duration >= (select activated_at from public.analytics_configuration limit 1),'pro',pro,'timezone',p_timezone,'start',p_start,'end',p_end,
    'overview',coalesce((select jsonb_object_agg(name,to_jsonb(t)-'name') from totals t),'{}'),
    'timeline',coalesce((select jsonb_agg(to_jsonb(t) order by bucket) from timeline t),'[]'),
    'links',coalesce((select jsonb_agg(case when pro then to_jsonb(l) else to_jsonb(l)-'plays'-'content_type'-'views' end) from link_totals l),'[]'),
    'dimensions',case when pro then coalesce((select jsonb_agg(to_jsonb(d)) from dimensions d),'[]') else '[]'::jsonb end,
    'campaigns',case when pro then coalesce((select jsonb_agg(to_jsonb(c)) from (
      select x.*,
        (select coalesce(sum(h.clicks),0) from public.analytics_campaign_hourly h where h.profile_id=pid and h.campaign=x.campaign and h.hour>=p_start and h.hour<p_end) clicks
      from (select utm->>'utm_campaign' campaign,count(*) visits,count(distinct visitor_id) visitors
        from sessions where utm ? 'utm_campaign' group by 1) x) c),'[]') else '[]'::jsonb end,
    'live',case when pro then (select count(distinct visitor_id) from public.analytics_sessions where profile_id=pid and last_seen>now()-interval '2 minutes') else null end
  ) into result;
  return result;
end $$;
revoke all on function public.analytics_report(timestamptz,timestamptz,text) from public,anon;
grant execute on function public.analytics_report(timestamptz,timestamptz,text) to authenticated;
