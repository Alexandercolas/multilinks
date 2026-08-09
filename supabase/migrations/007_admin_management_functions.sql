create or replace function public.admin_user_management_overview()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  username text,
  display_name text,
  published boolean,
  plan_name text,
  subscription_status text,
  suspended boolean,
  suspension_reason text,
  suspended_at timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    p.username,
    p.display_name,
    coalesce(p.published, false),
    coalesce(pl.name, 'Gratis'),
    coalesce(s.status, 'active'),
    m.suspended_at is not null,
    m.suspension_reason,
    m.suspended_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  left join public.plans pl on pl.id = s.plan_id
  left join public.account_moderation m on m.user_id = u.id
  order by u.created_at desc;
end;
$$;

create or replace function public.admin_review_profile_report(target_report uuid, new_status text, note text default null)
returns void language plpgsql security definer set search_path = public
as $$
declare target_user uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if new_status not in ('reviewing','resolved','dismissed') then raise exception 'Invalid report status'; end if;

  update public.profile_reports
  set status = new_status,
      reviewed_by = auth.uid(),
      reviewed_at = case when new_status in ('resolved','dismissed') then now() else null end,
      resolution_note = case when note is null then null else left(trim(note), 1000) end
  where id = target_report
  returning profile_id into target_user;

  if target_user is null then raise exception 'Report not found'; end if;

  insert into public.admin_action_logs (actor_id, target_user_id, action, details)
  values (
    auth.uid(),
    target_user,
    case when new_status = 'dismissed' then 'dismiss_report' else 'review_report' end,
    jsonb_build_object('report_id', target_report, 'status', new_status, 'note', note)
  );
end;
$$;

revoke all on function public.admin_user_management_overview() from public, anon;
revoke all on function public.admin_review_profile_report(uuid, text, text) from public, anon;
grant execute on function public.admin_user_management_overview() to authenticated;
grant execute on function public.admin_review_profile_report(uuid, text, text) to authenticated;
