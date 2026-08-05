create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id text primary key,
  name text unique not null,
  description text not null,
  price_monthly integer not null default 0 check (price_monthly >= 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (id, name, description, price_monthly, features) values
  ('free', 'Gratis', 'Para crear y compartir una página personal.', 0, '["Enlaces ilimitados","Personalización básica","Estadísticas generales"]'::jsonb),
  ('pro', 'Pro', 'Para creadores y negocios que quieren crecer.', 499, '["Todo lo del plan Gratis","Estadísticas avanzadas","Más personalización","Soporte prioritario"]'::jsonb)
on conflict (id) do update set name = excluded.name, description = excluded.description, price_monthly = excluded.price_monthly, features = excluded.features;

insert into public.subscriptions (user_id, plan_id, status)
select id, 'free', 'active' from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create or replace function public.create_free_subscription()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.subscriptions (user_id, plan_id) values (new.id, 'free') on conflict do nothing; return new; end $$;

drop trigger if exists create_free_subscription_on_signup on auth.users;
create trigger create_free_subscription_on_signup after insert on auth.users for each row execute function public.create_free_subscription();

alter table public.admins enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Admins see their access" on public.admins;
create policy "Admins see their access" on public.admins for select using (user_id = auth.uid());
drop policy if exists "Plans are public" on public.plans;
create policy "Plans are public" on public.plans for select using (active = true or public.is_admin());
drop policy if exists "Users view their subscription" on public.subscriptions;
create policy "Users view their subscription" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles" on public.profiles for select using (public.is_admin());
drop policy if exists "Admins view all links" on public.links;
create policy "Admins view all links" on public.links for select using (public.is_admin());
drop policy if exists "Admins view all analytics" on public.profile_daily_views;
create policy "Admins view all analytics" on public.profile_daily_views for select using (public.is_admin());

create or replace function public.admin_user_overview()
returns table (id uuid, email text, created_at timestamptz, username text, display_name text, plan_name text, subscription_status text)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select u.id, u.email::text, u.created_at, p.username, p.display_name, coalesce(pl.name, 'Gratis'), coalesce(s.status, 'active')
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  left join public.plans pl on pl.id = s.plan_id
  order by u.created_at desc;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_user_overview() to authenticated;
