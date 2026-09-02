-- Optional one-line description shown under a link's title on the profile.

alter table public.links
  add column if not exists description text not null default '';
