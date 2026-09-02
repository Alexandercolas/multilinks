-- The Free plan now includes three complimentary presets from the elegant line:
-- blush-veil, champagne and soft-violet. Everything else stays Pro.

create or replace function public.enforce_profile_pro_features()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.theme = 'neon'
    or (
      new.background_color like 'preset:%'
      and new.background_color <> all (array[
        'preset:blush-veil',
        'preset:champagne',
        'preset:soft-violet'
      ])
    )
    or new.background_color like 'image:%'
    or new.cover_image is not null
  ) and not public.account_has_pro(new.id) then
    raise exception using
      errcode = 'P0001',
      message = 'Los temas y fondos premium son exclusivos de MultiLinks Pro';
  end if;

  if new.background_color like 'image:%'
     and new.background_color !~ ('^image:' || new.id::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception using
      errcode = 'P0001',
      message = 'Ruta de imagen de fondo inválida';
  end if;

  if new.cover_image is not null
     and new.cover_image !~ ('^' || new.id::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception using
      errcode = 'P0001',
      message = 'Ruta de imagen de portada inválida';
  end if;

  return new;
end;
$$;
