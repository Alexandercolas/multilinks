create or replace function public.admin_platform_metrics()
returns table (total_users bigint, active_profiles bigint)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select
    (select count(*) from auth.users),
    (select count(*) from public.profiles p left join public.account_moderation m on m.user_id = p.id where p.published and m.suspended_at is null);
end;
$$;

create or replace function public.admin_user_management_page(search_query text default '', page_size integer default 5, page_offset integer default 0)
returns table (
  id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  username text, display_name text, published boolean, plan_name text,
  subscription_status text, suspended boolean, suspension_reason text,
  suspended_at timestamptz, total_count bigint
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select
    u.id, u.email::text, u.created_at, u.last_sign_in_at, p.username, p.display_name,
    coalesce(p.published, false), coalesce(pl.name, 'Gratis'), coalesce(s.status, 'active'),
    m.suspended_at is not null, m.suspension_reason, m.suspended_at, count(*) over()
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  left join public.plans pl on pl.id = s.plan_id
  left join public.account_moderation m on m.user_id = u.id
  where trim(coalesce(search_query, '')) = ''
    or u.email ilike '%' || trim(search_query) || '%'
    or p.username ilike '%' || trim(search_query) || '%'
    or p.display_name ilike '%' || trim(search_query) || '%'
  order by u.created_at desc
  limit least(greatest(page_size, 1), 25)
  offset greatest(page_offset, 0);
end;
$$;

create or replace function public.admin_recent_audit(max_rows integer default 100)
returns table (
  id bigint, target_user_id uuid, action text, details jsonb, created_at timestamptz,
  target_email text, target_username text, target_display_name text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select l.id, l.target_user_id, l.action, l.details, l.created_at,
    u.email::text, p.username, p.display_name
  from public.admin_action_logs l
  left join auth.users u on u.id = l.target_user_id
  left join public.profiles p on p.id = l.target_user_id
  order by l.created_at desc
  limit least(greatest(max_rows, 1), 100);
end;
$$;

revoke all on function public.admin_platform_metrics() from public, anon;
revoke all on function public.admin_user_management_page(text, integer, integer) from public, anon;
revoke all on function public.admin_recent_audit(integer) from public, anon;
grant execute on function public.admin_platform_metrics() to authenticated;
grant execute on function public.admin_user_management_page(text, integer, integer) to authenticated;
grant execute on function public.admin_recent_audit(integer) to authenticated;
