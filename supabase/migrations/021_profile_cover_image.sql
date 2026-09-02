-- Cover image: a banner across the top of the public profile, above the photo.
-- Independent from the page background. Pro only, stored in the same bucket as
-- background images ('backgrounds', file prefixed with the owner's folder).

alter table public.profiles
  add column if not exists cover_image text;

create or replace function public.enforce_profile_pro_features()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Premium theme / preset / custom background image / cover require Pro.
  if (
    new.theme = 'neon'
    or (
      new.background_color like 'preset:%'
      and new.background_color <> 'preset:blush-veil'
    )
    or new.background_color like 'image:%'
    or new.cover_image is not null
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

  -- Same for the cover image path.
  if new.cover_image is not null
     and new.cover_image !~ ('^' || new.id::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception using
      errcode = 'P0001',
      message = 'Ruta de imagen de portada inválida';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_pro_features_trigger on public.profiles;
create trigger enforce_profile_pro_features_trigger
before insert or update of theme, background_color, cover_image on public.profiles
for each row execute function public.enforce_profile_pro_features();
