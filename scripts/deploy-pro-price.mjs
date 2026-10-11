import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
const connection=process.env.supabase_POSTGRES_URL_NON_POOLING ?? process.env.supabase_POSTGRES_URL;
if(!connection) throw new Error('Database connection missing');
const sql=postgres(connection,{max:1,ssl:'require',connect_timeout:15});
try {
 await sql.begin(async tx=>{
  await tx`select pg_advisory_xact_lock(728033)`;
  await tx.unsafe(await readFile(new URL('../supabase/migrations/033_pro_monthly_price.sql',import.meta.url),'utf8'));
  const [plan]=await tx`select price_monthly from public.plans where id='pro'`;
  if(plan.price_monthly!==300) throw new Error('Price verification failed');
 });
 console.log('Pro price updated to USD 3/month. Existing trials and paid subscriptions preserved.');
} finally {await sql.end();}
