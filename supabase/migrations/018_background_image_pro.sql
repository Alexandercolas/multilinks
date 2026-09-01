-- Custom profile background images (Pro only).
-- Free keeps solid colors and the complimentary preset; uploading an image is Pro.
-- background_color now also accepts 'image:<uid>/<file>' pointing at the owner's
-- own object in the public 'backgrounds' bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('backgrounds', 'backgrounds', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Background images are public" on storage.objects;
drop policy if exists "Users upload their background" on storage.objects;
drop policy if exists "Users update their background" on storage.objects;
drop policy if exists "Users delete their background" on storage.objects;
create policy "Background images are public" on storage.objects for select using (bucket_id = 'backgrounds');
create policy "Users upload their background" on storage.objects for insert with check (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update their background" on storage.objects for update using (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their background" on storage.objects for delete using (bucket_id = 'backgrounds' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.enforce_profile_pro_features()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Premium theme / preset / custom background image require an active Pro plan.
  if (
    new.theme = 'neon'
    or (
      new.background_color like 'preset:%'
      and new.background_color <> 'preset:blush-veil'
    )
    or new.background_color like 'image:%'
  ) and not public.account_has_pro(new.id) then
    raise exception using
      errcode = 'P0001',
      message = 'Los temas y fondos premium son exclusivos de MultiLinks Pro';
  end if;

  -- A custom background image may only reference the owner's own storage folder.
  if new.background_color like 'image:%'
     and new.background_color !~ ('^image:' || new.id::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception using
      errcode = 'P0001',
      message = 'Ruta de imagen de fondo inválida';
  end if;

  return new;
end;
$$;
