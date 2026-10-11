import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } =
  await import("../.analytics-test-runtime/node_modules/@electric-sql/pglite/dist/index.js");
const db = new PGlite();
try {
  await db.exec(`
create role anon;create role authenticated;create role service_role;
create schema auth;create schema storage;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.user',true),'')::uuid$$;
create table auth.users(id uuid primary key,created_at timestamptz default now());
create table public.admins(user_id uuid primary key);
create table public.plans(id text primary key,name text,price_monthly integer,features jsonb);
insert into plans values('free','Free',0,'[]'),('pro','Pro',350,'[]');
create table public.subscriptions(user_id uuid primary key references auth.users(id),plan_id text references plans(id),status text default 'active',provider_customer_id text,provider_subscription_id text unique,current_period_end timestamptz,created_at timestamptz default now(),updated_at timestamptz default now(),provider_variant_id text,billing_interval text,billing_portal_url text,pro_welcome_seen boolean default false);
create table public.profiles(id uuid primary key references auth.users(id),published boolean default true,theme text default 'lime',background_color text default '#c9ff58',cover_image text,bio text default '');
create table public.links(id uuid primary key,profile_id uuid references profiles(id),url text,active boolean default true,position integer,created_at timestamptz default now(),clicks integer default 0,plays integer default 0,title text default 'Test',provider text default 'generic',metadata jsonb default '{}',link_type text default 'standard');
create table public.link_daily_clicks(link_id uuid,day date,clicks integer,primary key(link_id,day));
create table public.link_daily_plays(link_id uuid,day date,plays integer,primary key(link_id,day));
create table public.billing_webhook_events(id text primary key,event_name text,processed_at timestamptz default now());
create table storage.objects(bucket_id text,name text);
create function storage.foldername(value text) returns text[] language sql as $$select string_to_array(value,'/')$$;
create function public.is_admin() returns boolean language sql security definer as $$select exists(select 1 from public.admins where user_id=auth.uid())$$;
create function public.profile_is_available(id uuid) returns boolean language sql security definer as $$select exists(select 1 from profiles where profiles.id=$1 and published)$$;
create function public.create_free_subscription() returns trigger language plpgsql as $$begin insert into subscriptions(user_id,plan_id) values(new.id,'free');return new;end$$;
create trigger subscription_on_signup after insert on auth.users for each row execute function public.create_free_subscription();
alter table subscriptions enable row level security;
grant select on subscriptions to authenticated;
create policy owner_subscription on subscriptions for select using(user_id=auth.uid());
alter table profiles enable row level security;
alter table links enable row level security;
grant select,insert,update on profiles,links to authenticated;
grant select on profiles,links to anon;
create policy owner_profiles on profiles for all using(id=auth.uid()) with check(id=auth.uid());
create policy owner_links on links for all using(profile_id=auth.uid()) with check(profile_id=auth.uid());
`);
  const old = "00000000-0000-0000-0000-000000000001";
  const young = "00000000-0000-0000-0000-000000000002";
  const fresh = "00000000-0000-0000-0000-000000000003";
  await db.query(
    "insert into auth.users(id,created_at) values($1,now()-interval '80 days'),($2,now()-interval '3 days')",
    [old, young],
  );
  const migration = await readFile(
    new URL(
      "../supabase/migrations/028_premium_trial_and_access.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(migration);
  await db.exec(migration);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/027_analytics_v2.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    `create trigger profile_gate before insert or update on profiles for each row execute function enforce_profile_pro_features();`,
  );

  await db.exec(`alter table auth.users add column email text, add column last_sign_in_at timestamptz; alter table profiles add column username text, add column display_name text;
create table account_moderation(user_id uuid primary key,suspended_at timestamptz,suspended_by uuid,suspension_reason text,updated_at timestamptz);
create table admin_action_logs(id bigint generated always as identity,actor_id uuid,target_user_id uuid,action text,details jsonb,created_at timestamptz default now());`);
  const owner = old,
    second = young,
    target = fresh;
  await db.query("insert into auth.users(id) values($1)", [target]);
  await db.query(
    "insert into profiles(id,username) values($1,'owner-fixture'),($2,'other-admin'),($3,'target-fixture')",
    [owner, second, target],
  );
  await db.query("insert into admins(user_id) values($1),($2)", [
    owner,
    second,
  ]);
  const moderation = await readFile(
    new URL(
      "../supabase/migrations/006_moderation_support_and_auth_security.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await db.exec(
    moderation.slice(
      moderation.indexOf(
        "create or replace function public.admin_set_user_suspension",
      ),
      moderation.indexOf('drop policy if exists "Public profiles are visible"'),
    ),
  );
  const controls = (
    await readFile(
      new URL(
        "../supabase/migrations/032_owner_admin_controls.sql",
        import.meta.url,
      ),
      "utf8",
    )
  ).replace("('alexander-x','colasalexander69')", "('owner-fixture')");
  await db.exec(controls);
  await db.exec(controls);
  const user = async (id) =>
    db.query("select set_config('test.user',$1,false)", [id]);
  const access = async () =>
    (await db.query("select account_access() value")).rows[0].value;
  const change = async (command, days = null, id = target) =>
    db.query("select admin_control_user($1,$2,$3,$4)", [
      id,
      command,
      "QA verification",
      days,
    ]);
  await user(second);
  assert.equal((await db.query("select is_admin() v")).rows[0].v, false);
  await assert.rejects(() => change("premium_on"));
  await db.exec("set role authenticated");
  await assert.rejects(() =>
    db.query(
      "insert into admin_premium_overrides(user_id,enabled,reason) values($1,true,$2)",
      [target, "unauthorized"],
    ),
  );
  await db.exec("reset role");
  await user(owner);
  assert.equal((await db.query("select is_admin() v")).rows[0].v, true);
  await assert.rejects(() => change("premium_off", null, owner));
  await assert.rejects(() => change("premium_on", 5));
  await change("premium_on", 30);
  await user(target);
  assert.equal((await access()).has_premium, true);
  assert.equal((await access()).source, "admin");
  assert.ok((await access()).access_ends_at);
  await user(owner);
  await change("premium_off");
  await user(target);
  assert.equal((await access()).has_premium, false);
  assert.equal((await access()).state, "FREE");
  await user(owner);
  await change("premium_reset");
  await user(target);
  assert.equal((await access()).source, "trial");
  await db.query(
    "update subscriptions set plan_id='pro',status='active',provider_subscription_id='qa-payment',current_period_end=now()+interval '30 days' where user_id=$1",
    [target],
  );
  await user(owner);
  await change("premium_off");
  await user(target);
  assert.equal((await access()).has_premium, false);
  assert.equal((await access()).has_subscription, true);
  await user(owner);
  await change("premium_reset");
  await user(target);
  assert.equal((await access()).source, "subscription");
  await user(owner);
  await change("premium_on", 30);
  await db.query(
    "update admin_premium_overrides set expires_at=now()-interval '1 second' where user_id=$1",
    [target],
  );
  await user(target);
  assert.equal((await access()).source, "subscription");
  await user(owner);
  await change("hide_profile");
  assert.equal(
    (await db.query("select published from profiles where id=$1", [target]))
      .rows[0].published,
    false,
  );
  await change("show_profile");
  await change("suspend");
  assert.ok(
    (
      await db.query(
        "select suspended_at from account_moderation where user_id=$1",
        [target],
      )
    ).rows[0].suspended_at,
  );
  await change("reactivate");
  const listing = (await db.query("select * from admin_user_control_page()"))
    .rows;
  assert.equal(listing.length, 3);
  assert.equal(listing.filter((r) => r.is_owner).length, 1);
  assert.ok(
    (await db.query("select count(*)::int n from admin_action_logs")).rows[0]
      .n >= 8,
  );
  await db.query("insert into platform_owner(user_id) values($1)", [second]);
  await user(second);
  assert.equal((await db.query("select is_admin() v")).rows[0].v, true);
  await assert.rejects(() => change("premium_off", null, owner));
  await assert.rejects(() =>
    db.query("select admin_set_user_suspension($1,true,$2)", [
      owner,
      "QA reason",
    ]),
  );
  await user(owner);
  await assert.rejects(() => change("suspend", null, second));
  console.log(
    "Owner admin SQL passed: exclusive owner, denied second administrator, denied direct writes, self-protection, manual Premium/Free, expiry, automatic restoration, billing preservation, visibility, suspension and audit.",
  );
} finally {
  await db.close();
}
