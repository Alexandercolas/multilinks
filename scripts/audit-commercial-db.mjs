import postgres from 'postgres';
const sql = postgres(process.env.supabase_POSTGRES_URL_NON_POOLING ?? process.env.supabase_POSTGRES_URL, { max: 1, ssl: 'require', connect_timeout: 15 });
try {
  const [result] = await sql`select current_setting('server_version') version,
    to_regclass('public.analytics_configuration') is_analytics_ready,
    to_regprocedure('public.account_access()') is_trial_ready,
    to_regprocedure('public.record_link_play(uuid)') is_media_ready,
    exists(select 1 from pg_namespace where nspname='cron') cron_ready`;
  console.log(JSON.stringify(result));
  const [counts] = await sql`select count(*)::int accounts,
    count(*) filter(where plan_id='pro')::int pro_accounts,
    count(*) filter(where provider_subscription_id is not null)::int linked_subscriptions from public.subscriptions`;
  console.log(JSON.stringify(counts));
} finally { await sql.end(); }
