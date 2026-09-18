-- Smart Media Links analytics: count when a visitor actually presses play on
-- an embedded card (Spotify/YouTube/SoundCloud/Apple Music/Deezer/Vimeo),
-- separate from a plain link click. Mirrors link_daily_clicks exactly.

alter table public.links add column if not exists plays integer not null default 0 check (plays >= 0);

create table if not exists public.link_daily_plays (
  link_id uuid not null references public.links(id) on delete cascade,
  day date not null default current_date,
  plays integer not null default 0 check (plays >= 0),
  primary key (link_id, day)
);
alter table public.link_daily_plays enable row level security;

drop policy if exists "Owners view daily plays" on public.link_daily_plays;
create policy "Owners view daily plays" on public.link_daily_plays for select using (
  public.is_admin()
  or exists (
    select 1 from public.links
    where links.id = link_daily_plays.link_id and links.profile_id = auth.uid()
  )
);

create or replace function public.record_link_play(target_link uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
declare updated boolean;
begin
  update public.links set plays = plays + 1
  where id = target_link and active = true and public.profile_is_available(profile_id)
  returning true into updated;

  if updated then
    insert into public.link_daily_plays (link_id, day, plays) values (target_link, current_date, 1)
    on conflict (link_id, day) do update set plays = link_daily_plays.plays + 1;
  end if;
  return coalesce(updated, false);
end;
$$;

revoke all on function public.record_link_play(uuid) from public, anon, authenticated;
grant execute on function public.record_link_play(uuid) to service_role;
