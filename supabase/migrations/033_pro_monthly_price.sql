-- New purchases use US$3/month. Existing provider subscriptions are untouched.
update public.plans set price_monthly=300 where id='pro';

-- Grant one automatic, card-free trial when the account is first created.
-- Do not renew trials when the profile is edited or the user signs in again.
create or replace function public.create_free_subscription()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.subscriptions(user_id,plan_id,status,trial_started_at,trial_ends_at,trial_status)
  values(new.id,'free','active',new.created_at,new.created_at+interval '30 days','active') on conflict do nothing;
  insert into public.billing_access_events(user_id,event_name) values(new.id,'trial_started');
  return new;
end $$;

