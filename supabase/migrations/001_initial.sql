create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text not null default '' check (char_length(bio) <= 240),
  avatar_url text,
  theme text not null default 'lime' check (theme in ('lime','violet','sunset')),
  background_color text not null default '#c9ff58',
  accent_color text not null default '#8566ff',
  button_style text not null default 'rounded' check (button_style in ('rounded','pill','square')),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  url text not null check (char_length(url) <= 2048),
  active boolean not null default true,
  position integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.links enable row level security;

drop policy if exists "Public profiles are visible" on public.profiles;
drop policy if exists "Users create their profile" on public.profiles;
drop policy if exists "Users update their profile" on public.profiles;
drop policy if exists "Users delete their profile" on public.profiles;
create policy "Public profiles are visible" on public.profiles for select using (published or auth.uid() = id);
create policy "Users create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users delete their profile" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "Published links are visible" on public.links;
drop policy if exists "Users create their links" on public.links;
drop policy if exists "Users update their links" on public.links;
drop policy if exists "Users delete their links" on public.links;
create policy "Published links are visible" on public.links for select using (
  exists (select 1 from public.profiles where profiles.id = links.profile_id and (profiles.published or profiles.id = auth.uid()))
);
create policy "Users create their links" on public.links for insert with check (auth.uid() = profile_id);
create policy "Users update their links" on public.links for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "Users delete their links" on public.links for delete using (auth.uid() = profile_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 1048576;

drop policy if exists "Avatar images are public" on storage.objects;
drop policy if exists "Users upload their avatar" on storage.objects;
drop policy if exists "Users update their avatar" on storage.objects;
drop policy if exists "Users delete their avatar" on storage.objects;
create policy "Avatar images are public" on storage.objects for select using (bucket_id = 'avatars');
create policy "Users upload their avatar" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their avatar" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their avatar" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
