alter table public.admin_action_logs drop constraint if exists admin_action_logs_action_check;
alter table public.admin_action_logs add constraint admin_action_logs_action_check
check (action in ('suspend_user','reactivate_user','review_report','dismiss_report','update_support','close_support'));

create or replace function public.admin_update_support_request(target_request uuid, new_status text)
returns void language plpgsql security definer set search_path = public
as $$
declare target_user uuid;
begin
  if not public.is_admin() then raise exception 'Not authorized'; end if;
  if new_status not in ('open','in_progress','closed') then raise exception 'Invalid support status'; end if;

  update public.support_requests
  set status = new_status, updated_at = now()
  where id = target_request
  returning user_id into target_user;

  if not found then raise exception 'Support request not found'; end if;

  insert into public.admin_action_logs (actor_id, target_user_id, action, details)
  values (
    auth.uid(),
    target_user,
    case when new_status = 'closed' then 'close_support' else 'update_support' end,
    jsonb_build_object('support_request_id', target_request, 'status', new_status)
  );
end;
$$;

revoke all on function public.admin_update_support_request(uuid, text) from public, anon;
grant execute on function public.admin_update_support_request(uuid, text) to authenticated;
