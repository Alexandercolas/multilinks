process.on("uncaughtException", e => { console.error(e.message, e.detail ?? "", e.hint ?? "", e.position ?? ""); process.exitCode = 1; });
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import('../.analytics-test-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.user', true),'')::uuid $$;
create table public.profiles(id uuid primary key, published boolean default true);
create table public.links(id uuid primary key, profile_id uuid references public.profiles(id), active boolean default true, url text default 'https://open.spotify.com/playlist/example', title text, provider text, metadata jsonb default '{}', link_type text);
create function public.profile_is_available(id uuid) returns boolean language sql as $$ select coalesce((select published from profiles where profiles.id=$1),false) $$;
create function public.link_is_published(id uuid) returns boolean language sql as $$ select exists(select 1 from links where links.id=$1 and active and public.profile_is_available(profile_id)) $$;
create function public.account_has_pro(id uuid) returns boolean language sql as $$ select coalesce(current_setting('test.pro',true),'false')='true' $$;
`);
const migration = await readFile(new URL('../supabase/migrations/027_analytics_v2.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // Normal setup script can replay migrations.
const conversionMigration = await readFile(new URL('../supabase/migrations/031_visitor_conversion.sql', import.meta.url), 'utf8');
await db.exec(conversionMigration);
await db.exec(conversionMigration);
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const link='00000000-0000-0000-0000-000000000003';
const otherLink='00000000-0000-0000-0000-000000000004';
await db.query('insert into profiles(id) values($1),($2)',[owner,other]);
await db.query(`insert into links(id,profile_id,title,provider,link_type) values($1,$2,'Spotify','spotify','media'),($3,$4,'Other','generic','standard')`,[link,owner,otherLink,other]);
await db.query("select set_config('test.user',$1,false), set_config('test.pro','true',false)",[owner]);
await db.exec("update analytics_configuration set activated_at=now()-interval '200 days', conversion_activated_at=now()-interval '200 days'");
const now=new Date(); const end=new Date(now);end.setUTCMinutes(0,0,0);end.setUTCHours(end.getUTCHours()+1);
const start=new Date(end.getTime()-7*86400000);
const report=async(a=start,b=end)=> (await db.query('select analytics_report($1,$2,$3) result',[a.toISOString(),b.toISOString(),'America/Santo_Domingo'])).rows[0].result;
assert.equal((await report()).overview.current.visits,0);
const context={session:'00000000-0000-0000-0000-000000000010',visitor:'00000000-0000-0000-0000-000000000020',device:'Mobile',browser:'Chrome',os:'Android',source:'tiktok',utm:{utm_campaign:'launch',utm_source:'tiktok'}};
const event=async(kind,p=owner,l=null,c=context)=>db.query('select record_analytics_event($1,$2,$3,$4::jsonb)',[p,l,kind,JSON.stringify(c)]);
await event('page_view'); await event('page_view');
await event('link_click',null,link); await event('link_click',null,link); await event('media_play',null,link);
await event('link_views',owner,null,{...context,links:[link,otherLink]});
await event('link_views',owner,null,{...context,links:[link]});
let r=await report();
assert.deepEqual(r.overview.current,{visits:1,visitors:1,clicks:2,engaged_visitors:1});
assert.equal(r.links[0].plays,1);assert.equal(r.links[0].views,1);assert.equal(r.links[0].provider,'spotify');assert.equal(r.links[0].content_type,'playlist');
assert.equal(r.campaigns[0].clicks,2);assert.equal(r.campaigns[0].visits,1);assert.equal(r.live,1);
assert.equal(r.dimensions.find(d=>d.dimension==='sources').label,'tiktok');
assert.equal(r.dimensions.find(d=>d.dimension==='countries').label,'Unknown');
assert.equal(r.timeline.reduce((n,t)=>n+t.clicks,0),2);
await event('page_view',owner,null,{...context,session:'00000000-0000-0000-0000-000000000011'});
r=await report(); assert.equal(r.overview.current.visits,2);assert.equal(r.overview.current.visitors,1);
await db.query("select set_config('test.user',$1,false)",[other]);
r=await report();assert.equal(r.overview.current.clicks,0);assert.equal(r.links.length,0);
await db.query("select set_config('test.user',$1,false),set_config('test.pro','false',false)",[owner]);
r=await report(); assert.equal(r.pro,false);assert.equal(r.dimensions.length,0);assert.equal(r.campaigns.length,0);assert.equal(r.live,null);assert.equal(r.overview.previous,undefined);assert.equal(r.links[0].plays,undefined);
await assert.rejects(()=>report(new Date(end.getTime()-30*86400000),end));
await assert.rejects(()=>report(end,start));
await db.query("select set_config('test.user','',false)");await assert.rejects(()=>report());
await db.exec('set role authenticated');
await assert.rejects(()=>db.query('select * from analytics_sessions'));
await assert.rejects(()=>event('page_view'));
await db.exec('reset role');
await db.query('update profiles set published=false where id=$1',[owner]);
await event('link_click',null,link);
assert.equal((await db.query('select sum(clicks)::int n from analytics_hourly')).rows[0].n,2);
await db.query("select set_config('test.user',$1,false),set_config('test.pro','true',false)",[owner]);
await db.query(`insert into analytics_sessions(profile_id,session_id,visitor_id,viewed,device,browser,os,country,source,started_at)
  select $1,gen_random_uuid(),gen_random_uuid(),true,case when n%2=0 then 'Mobile' else 'Desktop' end,
  'Chrome','Other',case when n%2=0 then 'DO' else 'US' end,'qr',now()-make_interval(mins=>n)
  from generate_series(1,1200) n`,[owner]);
r=await report();assert.equal(r.overview.current.visits,1202);assert.equal(r.overview.current.visitors,1201);
assert.equal(r.dimensions.find(d=>d.dimension==='countries'&&d.label==='DO').count,600);
assert.equal(r.dimensions.filter(d=>d.dimension==='devices').reduce((n,d)=>n+d.count,0),1202);
assert.equal(r.timeline.reduce((n,t)=>n+t.visits,0),1202);
await db.query(`insert into analytics_sessions(profile_id,session_id,visitor_id,viewed,device,browser,os,started_at)
  select $1,gen_random_uuid(),gen_random_uuid(),true,'Tablet','Safari','iOS',now()-interval '10 days'
  from generate_series(1,11)`,[owner]);
r=await report();assert.equal(r.overview.previous.visits,11);assert.equal(r.comparisonAvailable,true);
await db.exec('update analytics_configuration set activated_at=now()');
assert.equal((await report()).comparisonAvailable,false);
await assert.rejects(()=>db.query('select analytics_report($1,$2,$3)',[start.toISOString(),end.toISOString(),'Invalid/Zone']));
const dst = (await db.query(`with dates as (
  select day::date d,zone from generate_series(current_date-170,current_date-3,interval '1 day') day,
    (values ('America/New_York'),('Australia/Sydney')) z(zone)
) select d,zone from dates where ((d+1)::timestamp at time zone zone)-(d::timestamp at time zone zone)<>interval '24 hours' order by d desc limit 1`)).rows[0];
if (dst) {
  const bounds=(await db.query(`select (($1::date-1)::timestamp at time zone $2) a,(($1::date+2)::timestamp at time zone $2) b`,[dst.d,dst.zone])).rows[0];
  const result=(await db.query('select analytics_report($1,$2,$3) result',[bounds.a,bounds.b,dst.zone])).rows[0].result;
  assert.ok(result.timeline.some((row,i,all)=>i>0 && Math.abs(Date.parse(row.bucket)-Date.parse(all[i-1].bucket))!==86400000));
}
await db.close();
console.log('Analytics SQL: empty, session/visitor deduplication, clicks, plays, impressions, campaigns, attribution, timeline, ownership, Free/Pro, ranges, grants and unavailable profile passed.');
