import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
const connection=process.env.supabase_POSTGRES_URL_NON_POOLING ?? process.env.supabase_POSTGRES_URL;
if(!connection) throw new Error('Supabase database connection is missing');
const sql=postgres(connection,{max:1,ssl:'require',connect_timeout:15});
try {
  await sql.begin(async tx=>{
    await tx`select pg_advisory_xact_lock(728028)`;
    await tx`set local lock_timeout='15s'`;
    for(const file of ['027_analytics_v2.sql','028_premium_trial_and_access.sql']) {
      await tx.unsafe(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
    }
    const [checks]=await tx`select to_regprocedure('public.account_access()') is not null access_ready,
      to_regclass('public.analytics_configuration') is not null analytics_ready,
      (select price_monthly=350 from public.plans where id='pro') price_ready`;
    if(!checks.access_ready || !checks.analytics_ready || !checks.price_ready) throw new Error('Migration verification failed');
  });
  console.log('Analytics 2.0 and Premium trial migrations committed atomically.');
  const [jobs]=await sql`select count(*)::int active_jobs from cron.job where jobname='refresh-premium-access' and active`;
  console.log(JSON.stringify(jobs));
} finally {await sql.end();}
