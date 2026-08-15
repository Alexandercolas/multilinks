-- Keep premium presets protected at the database boundary while allowing the
-- single complimentary background offered with the Free plan.

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
      and new.background_color <> 'preset:blush-veil'
    )
  ) and not public.account_has_pro(new.id) then
    raise exception using
      errcode = 'P0001',
      message = 'Los temas y fondos premium son exclusivos de MultiLinks Pro';
  end if;

  return new;
end;
$$;
