-- Let a link be marked as "featured": rendered larger and more prominent on
-- the public profile. Plain boolean, no plan gate.

alter table public.links
  add column if not exists featured boolean not null default false;
