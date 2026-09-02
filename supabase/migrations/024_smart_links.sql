-- Smart Links: persist the detected provider, chosen card type, a thumbnail and
-- cached metadata for each link. Existing links keep working: they default to
-- provider='generic', link_type='standard', no thumbnail.

alter table public.links add column if not exists provider text not null default 'generic';
alter table public.links add column if not exists link_type text not null default 'standard';
alter table public.links add column if not exists thumbnail text not null default '';
alter table public.links add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.links drop constraint if exists links_provider_length;
alter table public.links add constraint links_provider_length
  check (char_length(provider) <= 40);

alter table public.links drop constraint if exists links_link_type_values;
alter table public.links add constraint links_link_type_values
  check (link_type in ('standard', 'simple', 'media', 'featured', 'social', 'action'));

-- thumbnail must be empty or a plain https URL — no data:/javascript:/http:
alter table public.links drop constraint if exists links_thumbnail_https;
alter table public.links add constraint links_thumbnail_https
  check (thumbnail = '' or thumbnail ~ '^https://[^\s"'']{1,590}$');

-- Server-side preview cache so pasting the same URL twice does not refetch.
-- Written only by the API route (service_role); RLS on, no policies = clients
-- can never touch it.
create table if not exists public.link_preview_cache (
  url_hash text primary key,
  url text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.link_preview_cache enable row level security;

revoke all on table public.link_preview_cache from anon, authenticated;
grant select, insert, update, delete on table public.link_preview_cache to service_role;
