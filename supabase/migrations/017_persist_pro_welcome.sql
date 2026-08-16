alter table public.subscriptions
  add column if not exists pro_welcome_seen boolean not null default false;

create or replace function public.claim_pro_welcome()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.subscriptions
  set pro_welcome_seen = true,
      updated_at = now()
  where user_id = auth.uid()
    and plan_id = 'pro'
    and status in ('active', 'trialing')
    and pro_welcome_seen = false
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke execute on function public.claim_pro_welcome() from public, anon;
grant execute on function public.claim_pro_welcome() to authenticated;
