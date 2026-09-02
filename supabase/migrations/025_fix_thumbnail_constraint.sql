-- Fix links_thumbnail_https: the previous regex used "\s" inside a bracket
-- expression, which Postgres treated as the literal letter "s" (and a
-- backslash) — so any https thumbnail containing an "s" was rejected and the
-- whole link save failed. Replace it with a plain, correct check.

alter table public.links drop constraint if exists links_thumbnail_https;
alter table public.links add constraint links_thumbnail_https
  check (
    thumbnail = ''
    or (thumbnail ~ '^https://' and char_length(thumbnail) between 9 and 590)
  );
