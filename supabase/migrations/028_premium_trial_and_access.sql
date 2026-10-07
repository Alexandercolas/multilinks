-- One source of truth, extending the existing subscriptions/plans model.
alter table public.subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_status text not null default 'expired' check(trial_status in ('active','expired')),
  add column if not exists provider_status text,
  add column if not exists provider_created_at timestamptz,
  add column if not exists provider_updated_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists past_due_since timestamptz;

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check(status in ('active','trialing','past_due','canceled','expired','paused','unpaid'));

-- Existing accounts get only their original remaining signup window, never a reset.
update public.subscriptions s set trial_started_at=u.created_at,
  trial_ends_at=u.created_at+interval '30 days',
  trial_status=case when u.created_at+interval '30 days'>now() then 'active' else 'expired' end
from auth.users u where u.id=s.user_id and s.trial_started_at is null;

create table if not exists public.billing_access_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  provider_subscription_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists billing_access_events_user_time on public.billing_access_events(user_id,created_at desc);
alter table public.billing_access_events enable row level security;
revoke all on public.billing_access_events from public,anon,authenticated;
grant select on public.billing_access_events to authenticated;
drop policy if exists "Owners view billing history" on public.billing_access_events;
create policy "Owners view billing history" on public.billing_access_events for select
  using(user_id=auth.uid() or public.is_admin());

create or replace function public.account_has_pro(target_user uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admins where user_id=target_user)
    or exists(select 1 from public.subscriptions s where user_id=target_user and (
      (trial_status='active' and trial_ends_at>now())
      or (plan_id='pro' and (
        (status in ('active','trialing','canceled') and
          (current_period_end>now() or (provider_subscription_id is null and status='active' and current_period_end is null)))
        or (status='past_due' and past_due_since+interval '14 days'>now())
      ))
    ));
$$;
revoke all on function public.account_has_pro(uuid) from public,anon;
grant execute on function public.account_has_pro(uuid) to authenticated,service_role;

create or replace function public.profile_has_pro(target_profile uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select public.profile_is_available(target_profile) and public.account_has_pro(target_profile);
$$;
revoke all on function public.profile_has_pro(uuid) from public;
grant execute on function public.profile_has_pro(uuid) to anon,authenticated,service_role;

create or replace function public.account_access()
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); s public.subscriptions; premium boolean; paid boolean; source text; state text; ends timestamptz;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  select * into s from public.subscriptions where user_id=uid;
  premium:=public.account_has_pro(uid);
  paid:=s.plan_id='pro' and (
    (s.status in ('active','trialing','canceled') and (s.current_period_end>now() or (s.provider_subscription_id is null and s.status='active' and s.current_period_end is null)))
    or (s.status='past_due' and s.past_due_since+interval '14 days'>now())
  );
  source:=case when exists(select 1 from public.admins where user_id=uid) then 'admin'
    when paid then 'subscription' when premium then 'trial' else 'free' end;
  ends:=case when source='trial' then s.trial_ends_at when source='subscription' and s.status='past_due' then s.past_due_since+interval '14 days'
    when source='subscription' then s.current_period_end else null end;
  state:=case when source='trial' then 'TRIAL' when source='admin' then 'PREMIUM_ACTIVE'
    when paid and s.status='past_due' then 'PREMIUM_PAST_DUE' when paid and s.status='canceled' then 'PREMIUM_CANCELED'
    when paid then 'PREMIUM_ACTIVE' when s.provider_subscription_id is not null or s.plan_id='pro' then 'PREMIUM_EXPIRED' else 'FREE' end;
  return jsonb_build_object('has_premium',premium,'source',source,'state',state,
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

create or replace function public.create_free_subscription()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.subscriptions(user_id,plan_id,status,trial_started_at,trial_ends_at,trial_status)
  values(new.id,'free','active',now(),now()+interval '30 days','active') on conflict do nothing;
  insert into public.billing_access_events(user_id,event_name) values(new.id,'trial_started');
  return new;
end $$;

create or replace function public.free_link_allowance(target_user uuid)
returns integer language sql stable security definer set search_path=public as $$ select 1 $$;
create or replace function public.profile_effective_link_limit(target_profile uuid)
returns integer language sql stable security definer set search_path=public as $$
  select case when public.account_has_pro(target_profile) then 2147483647 else 1 end;
$$;

-- active is the owner's publication intention. Entitlements determine visibility;
-- no destructive sweeps, deactivation or forced restoration of manually hidden links.
create or replace function public.enforce_free_link_limit()
returns trigger language plpgsql security definer set search_path=public as $$
begin return new; end $$;
create or replace function public.enforce_expired_free_link_limits()
returns integer language sql security definer set search_path=public as $$ select 0 $$;

create or replace function public.link_is_published(target_link uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.links l where id=target_link and active and public.profile_is_available(profile_id)
    and (public.account_has_pro(profile_id) or id=(
      select first.id from public.links first where first.profile_id=l.profile_id and first.active
      order by first.position,first.created_at,first.id limit 1
    )));
$$;
revoke all on function public.link_is_published(uuid) from public;
grant execute on function public.link_is_published(uuid) to anon,authenticated,service_role;
drop policy if exists "Published links are visible" on public.links;
create policy "Published links are visible" on public.links for select using (
  profile_id=auth.uid() or public.is_admin() or public.link_is_published(id)
);

create or replace function public.public_link_destination(target_link uuid)
returns text language sql stable security definer set search_path=public as $$
  select url from public.links where id=target_link and public.link_is_published(id);
$$;
create or replace function public.record_link_click(target_link uuid)
returns text language plpgsql security definer set search_path=public as $$
declare destination text;
begin
  update public.links set clicks=clicks+1 where id=target_link and public.link_is_published(id) returning url into destination;
  if destination is not null then
    insert into public.link_daily_clicks(link_id,day,clicks) values(target_link,current_date,1)
    on conflict(link_id,day) do update set clicks=link_daily_clicks.clicks+1;
  end if;
  return destination;
end $$;
create or replace function public.record_link_play(target_link uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare updated boolean;
begin
  update public.links set plays=plays+1 where id=target_link and public.link_is_published(id)
    and public.account_has_pro(profile_id) returning true into updated;
  if updated then
    insert into public.link_daily_plays(link_id,day,plays) values(target_link,current_date,1)
    on conflict(link_id,day) do update set plays=link_daily_plays.plays+1;
  end if;
  return coalesce(updated,false);
end $$;

create or replace function public.enforce_profile_pro_features()
returns trigger language plpgsql security definer set search_path=public as $$
declare previous public.profiles;
begin
  -- Also handles INSERT...ON CONFLICT from the current editor without rejecting
  -- unchanged saved Premium settings after expiration.
  select * into previous from public.profiles where id=new.id;
  if not public.account_has_pro(new.id) and (
    (new.theme='neon' and new.theme is distinct from previous.theme)
    or (new.background_color like 'image:%' and new.background_color is distinct from previous.background_color)
    or (new.background_color like 'preset:%' and new.background_color<>all(array['preset:blush-veil','preset:champagne','preset:soft-violet'])
      and new.background_color is distinct from previous.background_color)
    or (new.cover_image is not null and new.cover_image is distinct from previous.cover_image)
  ) then raise exception using errcode='P0001',message='Activa Premium para usar esta personalización. Tu contenido guardado se conserva.'; end if;
  if new.background_color like 'image:%' and new.background_color !~ ('^image:'||new.id::text||'/[A-Za-z0-9._-]{1,120}$') then
    raise exception 'Ruta de imagen de fondo inválida'; end if;
  if new.cover_image is not null and new.cover_image !~ ('^'||new.id::text||'/[A-Za-z0-9._-]{1,120}$') then
    raise exception 'Ruta de imagen de portada inválida'; end if;
  return new;
end $$;

-- Backend housekeeping: access checks above enforce time immediately, even if cron
-- is unavailable. This job materializes expirations and audit records every 15 min.
create or replace function public.refresh_expired_access()
returns integer language plpgsql security definer set search_path=public as $$
declare affected integer; trial_count integer;
begin
  with expired as (
    update public.subscriptions set trial_status='expired',updated_at=now()
    where trial_status='active' and trial_ends_at<=now() returning user_id
  ) insert into public.billing_access_events(user_id,event_name)
    select user_id,'trial_expired' from expired;
  get diagnostics trial_count=row_count;
  with expired as (
    update public.subscriptions set status='expired',updated_at=now()
    where plan_id='pro' and (
      (status in ('active','trialing','canceled') and current_period_end<=now())
      or (status='past_due' and past_due_since+interval '14 days'<=now())
    ) returning user_id,provider_subscription_id
  ) insert into public.billing_access_events(user_id,event_name,provider_subscription_id)
    select user_id,'premium_expired',provider_subscription_id from expired;
  get diagnostics affected=row_count;
  return affected+trial_count;
end $$;
revoke all on function public.refresh_expired_access() from public,anon,authenticated;
grant execute on function public.refresh_expired_access() to service_role;
do $$ begin
  if exists(select 1 from pg_namespace where nspname='cron') then
    perform cron.schedule('refresh-premium-access','*/15 * * * *','select public.refresh_expired_access()');
  end if;
end $$;


create table if not exists public.billing_checkout_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interval text not null check(interval in ('monthly','annual')),
  token uuid not null, expires_at timestamptz not null, url text
);
alter table public.billing_checkout_attempts enable row level security;
revoke all on public.billing_checkout_attempts from public,anon,authenticated;
create or replace function public.begin_premium_checkout(p_interval text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); attempt public.billing_checkout_attempts; access jsonb; new_token uuid;
begin
  if uid is null then raise exception 'Unauthorized'; end if;
  if p_interval not in ('monthly','annual') then raise exception 'Invalid interval'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,17));
  access:=public.account_access();
  if access->>'source' in ('subscription','admin') then return jsonb_build_object('blocked',true); end if;
  select * into attempt from public.billing_checkout_attempts where user_id=uid for update;
  if attempt.expires_at>now() and attempt.interval=p_interval then
    return jsonb_build_object('url',attempt.url,'busy',attempt.url is null);
  end if;
  if attempt.expires_at>now() and attempt.url is null then return jsonb_build_object('busy',true); end if;
  new_token:=gen_random_uuid();
  insert into public.billing_checkout_attempts(user_id,interval,token,expires_at)
  values(uid,p_interval,new_token,now()+interval '90 seconds')
  on conflict(user_id) do update set interval=excluded.interval,token=excluded.token,expires_at=excluded.expires_at,url=null;
  return jsonb_build_object('token',new_token,'price_monthly',access->'price_monthly');
end $$;
revoke all on function public.begin_premium_checkout(text) from public,anon;
grant execute on function public.begin_premium_checkout(text) to authenticated;
create or replace function public.finish_premium_checkout(p_user uuid,p_token uuid,p_url text)
returns boolean language plpgsql security definer set search_path=public as $$
declare saved boolean;
begin
  update public.billing_checkout_attempts set url=p_url,
    expires_at=case when p_url is null then now() else now()+interval '25 minutes' end
  where user_id=p_user and token=p_token returning true into saved;
  return coalesce(saved,false);
end $$;
revoke all on function public.finish_premium_checkout(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.finish_premium_checkout(uuid,uuid,text) to service_role;

-- Subscription-confirmation messages are never claimed for a local free trial.
create or replace function public.claim_pro_welcome()
returns boolean language plpgsql security definer set search_path=public as $$
declare claimed boolean;
begin
  update public.subscriptions set pro_welcome_seen=true,updated_at=now()
  where user_id=auth.uid() and provider_subscription_id is not null and status='active'
    and current_period_end>now() and not pro_welcome_seen returning true into claimed;
  return coalesce(claimed,false);
end $$;
revoke all on function public.claim_pro_welcome() from public,anon;
grant execute on function public.claim_pro_welcome() to authenticated;

-- New Premium asset uploads also require the same backend entitlement.
drop policy if exists "Users upload their background" on storage.objects;
drop policy if exists "Users update their background" on storage.objects;
create policy "Users upload their background" on storage.objects for insert with check (
  bucket_id='backgrounds' and (storage.foldername(name))[1]=auth.uid()::text and public.account_has_pro(auth.uid())
);
create policy "Users update their background" on storage.objects for update using (
  bucket_id='backgrounds' and (storage.foldername(name))[1]=auth.uid()::text and public.account_has_pro(auth.uid())
) with check (bucket_id='backgrounds' and (storage.foldername(name))[1]=auth.uid()::text and public.account_has_pro(auth.uid()));
create or replace function public.apply_billing_webhook(p_event_id text,p_event_name text,p_user_id uuid,p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.subscriptions; inserted text; provider_id text:=p_snapshot->>'id'; changed timestamptz:=(p_snapshot->>'updated_at')::timestamptz;
  started timestamptz:=(p_snapshot->>'created_at')::timestamptz; next_status text:=p_snapshot->>'status';
begin
  if p_user_id is null or provider_id is null or changed is null or started is null then raise exception 'Invalid snapshot'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,17));
  insert into public.billing_webhook_events(id,event_name) values(p_event_id,p_event_name)
    on conflict do nothing returning id into inserted;
  if inserted is null then return jsonb_build_object('duplicate',true); end if;
  if exists(select 1 from public.subscriptions where provider_subscription_id=provider_id and user_id<>p_user_id) then raise exception 'Ownership mismatch'; end if;
  select * into s from public.subscriptions where user_id=p_user_id for update;
  if (s.provider_subscription_id=provider_id and s.provider_updated_at>changed)
    or (s.provider_subscription_id is not null and s.provider_subscription_id<>provider_id and coalesce(s.provider_created_at,s.created_at)>=started) then
    return jsonb_build_object('stale',true);
  end if;
  insert into public.subscriptions(user_id,plan_id,status,provider_subscription_id,provider_customer_id,provider_variant_id,
    billing_interval,current_period_end,billing_portal_url,provider_status,provider_created_at,provider_updated_at,cancelled_at,past_due_since,updated_at)
  values(p_user_id,'pro',next_status,provider_id,p_snapshot->>'customer_id',p_snapshot->>'variant_id',p_snapshot->>'interval',
    (p_snapshot->>'period_end')::timestamptz,p_snapshot->>'portal_url',p_snapshot->>'provider_status',started,changed,
    case when next_status='canceled' then changed else null end,
    case when next_status='past_due' then changed else null end,now())
  on conflict(user_id) do update set plan_id=excluded.plan_id,status=excluded.status,
    provider_subscription_id=excluded.provider_subscription_id,provider_customer_id=excluded.provider_customer_id,
    provider_variant_id=excluded.provider_variant_id,billing_interval=excluded.billing_interval,current_period_end=excluded.current_period_end,
    billing_portal_url=excluded.billing_portal_url,provider_status=excluded.provider_status,provider_created_at=excluded.provider_created_at,
    provider_updated_at=excluded.provider_updated_at,cancelled_at=excluded.cancelled_at,
    past_due_since=case when excluded.status='past_due' and subscriptions.status='past_due' and subscriptions.provider_subscription_id=excluded.provider_subscription_id then subscriptions.past_due_since else excluded.past_due_since end,
    updated_at=now();
  delete from public.billing_checkout_attempts where user_id=p_user_id;
  insert into public.billing_access_events(user_id,event_name,provider_subscription_id,details)
  values(p_user_id,p_event_name,provider_id,jsonb_build_object('previous_status',s.status,'status',next_status));
  return jsonb_build_object('applied',true);
end $$;
revoke all on function public.apply_billing_webhook(text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_billing_webhook(text,text,uuid,jsonb) to service_role;

update public.plans set name='Free',price_monthly=0,
  features='["1 enlace publicado","Enlaces adicionales guardados","Personalización básica","Analytics básicos de 7 días","QR de perfil"]'::jsonb where id='free';
update public.plans set name='Premium',price_monthly=350,
  features='["Enlaces activos ilimitados","Smart Media completo","Fondos propios y temas premium","Analytics avanzados y CSV","Sin marca MultiLinks","30 días de prueba completa al registrarte"]'::jsonb where id='pro';
