alter table public.links add column if not exists icon text;
alter table public.links add column if not exists section_title text;

alter table public.links drop constraint if exists links_icon_length;
alter table public.links add constraint links_icon_length check (icon is null or char_length(icon) <= 500);
alter table public.links drop constraint if exists links_section_title_length;
alter table public.links add constraint links_section_title_length check (section_title is null or char_length(section_title) <= 60);
