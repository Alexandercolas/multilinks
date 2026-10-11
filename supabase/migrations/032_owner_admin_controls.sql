begin;
create table if not exists public.platform_owner(user_id uuid primary key references auth.users(id));
alter table public.platform_owner enable row level security;
revoke all on public.platform_owner from public,anon,authenticated;
insert into public.platform_owner(user_id) select a.user_id from public.admins a join public.profiles p on p.id=a.user_id where p.username in ('alexander-x','colasalexander69') on conflict(user_id) do nothing;
do $$ begin if not exists(select 1 from public.platform_owner) then raise exception 'Owner account must be selected'; end if; end $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.platform_owner where user_id=auth.uid()) $$;
create table if not exists public.admin_premium_overrides(user_id uuid primary key references auth.users(id) on delete cascade, enabled boolean not null, expires_at timestamptz, reason text not null, updated_by uuid references auth.users(id), updated_at timestamptz not null default now());
alter table public.admin_premium_overrides enable row level security;
revoke all on public.admin_premium_overrides from public,anon,authenticated;
alter table public.admin_action_logs drop constraint if exists admin_action_logs_action_check;
alter table public.admin_action_logs add constraint admin_action_logs_action_check check(action in ('suspend_user','reactivate_user','review_report','dismiss_report','update_support','close_support','premium_override','profile_visibility'));
create or replace function public.admin_set_user_suspension(target_user uuid, should_suspend boolean, reason text default null)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if exists(select 1 from public.platform_owner where user_id=target_user) then raise exception 'Owner account is protected'; end if;
  if should_suspend and (reason is null or char_length(trim(reason)) < 3) then raise exception 'A suspension reason is required'; end if;

  insert into public.account_moderation (user_id, suspended_at, suspended_by, suspension_reason, updated_at)
  values (target_user, case when should_suspend then now() else null end, case when should_suspend then auth.uid() else null end, case when should_suspend then left(trim(reason), 500) else null end, now())
  on conflict (user_id) do update set suspended_at = excluded.suspended_at, suspended_by = excluded.suspended_by,
    suspension_reason = excluded.suspension_reason, updated_at = now();

  insert into public.admin_action_logs (actor_id, target_user_id, action, details)
  values (auth.uid(), target_user, case when should_suspend then 'suspend_user' else 'reactivate_user' end,
    jsonb_build_object('reason', case when should_suspend then left(trim(reason), 500) else null end));
end;
$$;

create or replace function public.admin_control_user(target_user uuid, command text, reason text, days integer default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.is_admin() then raise exception 'Not authorized'; end if;
 if exists(select 1 from public.platform_owner where user_id=target_user) then raise exception 'Owner account is protected'; end if;
 if not exists(select 1 from auth.users where id=target_user) then raise exception 'User not found'; end if;
 if length(trim(coalesce(reason,'')))<3 or length(reason)>500 then raise exception 'Reason required'; end if;
 if command not in ('premium_on','premium_off','premium_reset','hide_profile','show_profile','suspend','reactivate') then raise exception 'Invalid command'; end if;
 if days is not null and days not in (30,90,365) then raise exception 'Invalid duration'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_user::text,1));
 if command in ('suspend','reactivate') then
  perform public.admin_set_user_suspension(target_user,command='suspend',reason); return;
 elsif command in ('hide_profile','show_profile') then
  if command='show_profile' and not exists(select 1 from public.profiles where id=target_user and username is not null and length(username)>=3) then raise exception 'Profile incomplete'; end if;
  update public.profiles set published=command='show_profile' where id=target_user;
  if not found then raise exception 'Profile not found'; end if;
  insert into public.admin_action_logs(actor_id,target_user_id,action,details) values(auth.uid(),target_user,'profile_visibility',jsonb_build_object('published',command='show_profile','reason',trim(reason)));
 else
  if command='premium_reset' then delete from public.admin_premium_overrides where user_id=target_user;
  else
   insert into public.admin_premium_overrides(user_id,enabled,expires_at,reason,updated_by) values(target_user,command='premium_on',case when command='premium_on' and days is not null then now()+make_interval(days=>days) else null end,trim(reason),auth.uid())
   on conflict(user_id) do update set enabled=excluded.enabled,expires_at=excluded.expires_at,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=now();
  end if;
  insert into public.admin_action_logs(actor_id,target_user_id,action,details) values(auth.uid(),target_user,'premium_override',jsonb_build_object('command',command,'days',days,'reason',trim(reason)));
 end if;
end $$;
revoke all on function public.admin_control_user(uuid,text,text,integer) from public,anon;
grant execute on function public.admin_control_user(uuid,text,text,integer) to authenticated;
create or replace function public.account_has_pro(target_user uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select case when exists(select 1 from public.platform_owner where user_id=target_user) then true
    when exists(select 1 from public.admin_premium_overrides where user_id=target_user and (expires_at is null or expires_at>now())) then (select enabled from public.admin_premium_overrides where user_id=target_user)
    else exists(select 1 from public.subscriptions s where user_id=target_user and (
      (trial_status='active' and trial_ends_at>now())
      or (plan_id='pro' and (
        (status in ('active','trialing','canceled') and
          (current_period_end>now() or (provider_subscription_id is null and status='active' and current_period_end is null)))
        or (status='past_due' and past_due_since+interval '14 days'>now())
      ))
    )) end;
$$;
revoke all on function public.account_has_pro(uuid) from public,anon;
grant execute on function public.account_has_pro(uuid) to authenticated,service_role;

create or replace function public.account_access()
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.subscriptions; premium boolean; paid boolean; source text; state text; ends timestamptz; ov public.admin_premium_overrides;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  select * into s from public.subscriptions where user_id=uid;
  premium:=public.account_has_pro(uid);
  paid:=s.plan_id='pro' and (
    (s.status in ('active','trialing','canceled') and (s.current_period_end>now() or (s.provider_subscription_id is null and s.status='active' and s.current_period_end is null)))
    or (s.status='past_due' and s.past_due_since+interval '14 days'>now())
  );
  select * into ov from public.admin_premium_overrides where user_id=uid and (expires_at is null or expires_at>now());
  if ov.user_id is not null then paid:=false; end if;
  source:=case when exists(select 1 from public.platform_owner where user_id=uid) then 'admin'
    when ov.enabled then 'admin' when paid then 'subscription' when premium then 'trial' else 'free' end;
  ends:=case when ov.enabled then ov.expires_at when source='trial' then s.trial_ends_at when source='subscription' and s.status='past_due' then s.past_due_since+interval '14 days'
    when source='subscription' then s.current_period_end else null end;
  state:=case when ov.user_id is not null and not ov.enabled then 'FREE' when source='trial' then 'TRIAL' when source='admin' then 'PREMIUM_ACTIVE'
    when paid and s.status='past_due' then 'PREMIUM_PAST_DUE' when paid and s.status='canceled' then 'PREMIUM_CANCELED'
    when paid then 'PREMIUM_ACTIVE' when s.provider_subscription_id is not null or s.plan_id='pro' then 'PREMIUM_EXPIRED' else 'FREE' end;
  return jsonb_build_object('admin_controlled',ov.user_id is not null,'has_premium',premium,'source',source,'state',state,
    'trial_started_at',s.trial_started_at,'trial_ends_at',s.trial_ends_at,
    'trial_status',case when s.trial_ends_at>now() and s.trial_status='active' then 'active' else 'expired' end,
    'days_remaining',case when ends is null then null else greatest(0,ceil(extract(epoch from ends-now())/86400)) end,
    'access_ends_at',ends,'subscription_status',s.status,'billing_interval',s.billing_interval,
    'has_subscription',s.provider_subscription_id is not null,
    'active_link_limit',case when premium then null else 1 end,
    'price_monthly',(select price_monthly from public.plans where id='pro'),'server_time',now(),
    'features',jsonb_build_object('basic_profile',true,'basic_analytics',true,'basic_personalization',true,'basic_qr',true,
      'unlimited_links',premium,'smart_media',premium,'custom_background',premium,'premium_themes',premium,
      'cover_image',premium,'advanced_analytics',premium,'analytics_export',premium,'remove_branding',premium));
end $$;
revoke all on function public.account_access() from public,anon;
grant execute on function public.account_access() to authenticated;

create or replace function public.admin_user_control_page(search_query text default '', page_size integer default 5, page_offset integer default 0)
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  username text, display_name text, published boolean, plan_name text,
  subscription_status text, suspended boolean, suspension_reason text,
  suspended_at timestamptz, total_count bigint, premium boolean, premium_override boolean, override_ends_at timestamptz, billing_connected boolean, is_owner boolean
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select
    u.id, u.email::text, u.created_at, u.last_sign_in_at, p.username, p.display_name,
    coalesce(p.published, false), coalesce(pl.name, 'Gratis'), coalesce(s.status, 'active'),
    m.suspended_at is not null, m.suspension_reason, m.suspended_at, count(*) over(), public.account_has_pro(u.id), o.user_id is not null and (o.expires_at is null or o.expires_at>now()), o.expires_at, s.provider_subscription_id is not null, exists(select 1 from public.platform_owner where user_id=u.id)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  left join public.plans pl on pl.id = s.plan_id
  left join public.account_moderation m on m.user_id = u.id
  left join public.admin_premium_overrides o on o.user_id=u.id
  where trim(coalesce(search_query, '')) = ''
    or u.email ilike '%' || trim(search_query) || '%'
    or p.username ilike '%' || trim(search_query) || '%'
    or p.display_name ilike '%' || trim(search_query) || '%'
  order by u.created_at desc
  limit least(greatest(page_size, 1), 25)
  offset greatest(page_offset, 0);
end;
$$;

revoke all on function public.admin_user_control_page(text,integer,integer) from public,anon;
grant execute on function public.admin_user_control_page(text,integer,integer) to authenticated;
commit;
