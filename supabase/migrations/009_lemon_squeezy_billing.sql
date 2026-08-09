alter table public.subscriptions
  add column if not exists provider_variant_id text,
  add column if not exists billing_interval text check (billing_interval in ('monthly','annual')),
  add column if not exists billing_portal_url text;

create unique index if not exists subscriptions_provider_subscription_idx
  on public.subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

create table if not exists public.billing_webhook_events (
  id text primary key,
  event_name text not null,
  processed_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;
revoke all on table public.billing_webhook_events from public, anon, authenticated;

update public.plans set
  price_monthly = 499,
  description = 'Para creadores y negocios que quieren crecer.',
  features = '["Enlaces ilimitados","Estadísticas completas","Temas premium","Sin marca MultiLinks","Soporte prioritario"]'::jsonb
where id = 'pro';

create or replace function public.enforce_free_link_limit()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  has_pro boolean;
  active_count integer;
begin
  if new.active is not true then return new; end if;
  select exists (
    select 1 from public.subscriptions
    where user_id = new.profile_id and plan_id = 'pro' and status in ('active','trialing')
  ) into has_pro;
  if has_pro then return new; end if;
  select count(*) into active_count from public.links
  where profile_id = new.profile_id and active = true and id <> new.id;
  if active_count >= 10 then raise exception 'El plan Gratis permite hasta 10 enlaces activos'; end if;
  return new;
end;
$$;

drop trigger if exists enforce_free_link_limit_trigger on public.links;
create trigger enforce_free_link_limit_trigger
before insert or update of active on public.links
for each row execute function public.enforce_free_link_limit();
