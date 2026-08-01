-- ============================================================================
-- SmartMindz — Supabase schema + seed
-- Run this in the Supabase SQL editor (or `psql`) once per project.
-- It is idempotent-ish: it drops nothing, but uses upserts for seed rows.
-- ============================================================================

-- ---- Tables ----------------------------------------------------------------

create table if not exists categories (
  id          text primary key,
  name        text not null,
  sort_order  int  not null default 0
);

create table if not exists events (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  description text,
  event_date  date,
  location    text,
  status      text not null default 'upcoming' check (status in ('upcoming','past')),
  cover_url   text,
  created_at  timestamptz not null default now()
);

create table if not exists event_categories (
  event_id    text not null references events(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  primary key (event_id, category_id)
);

create table if not exists team_members (
  id         text primary key,
  name       text not null,
  role       text not null,
  photo_url  text,
  sort_order int not null default 0
);

create table if not exists gallery_photos (
  -- text id (not uuid): the upload script derives a deterministic id from the
  -- source filename so re-running upserts instead of creating duplicates.
  id         text primary key,
  url        text not null,
  thumb_url  text,
  caption    text,
  event_id   text references events(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists site_content (
  key   text primary key,
  value jsonb not null
);

create table if not exists results (
  id        uuid primary key default gen_random_uuid(),
  event_id  text not null references events(id) on delete cascade,
  -- 'rule' = rules & guidelines section, 'result' = results section. Each
  -- event can have any number of rows of either kind.
  kind      text not null default 'result' check (kind in ('rule','result')),
  title     text not null,
  body      text,
  file_url  text
);

create index if not exists idx_results_event_kind on results(event_id, kind);

-- 4-digit human-friendly registration reference (1000–9999), globally unique.
create sequence if not exists registration_code_seq
  as integer minvalue 1000 maxvalue 9999 start with 1000;

create table if not exists registrations (
  id                uuid primary key default gen_random_uuid(),
  registration_code integer unique not null default nextval('registration_code_seq'),
  full_name         text not null,
  category_name     text,
  class_year        text,
  institution       text,
  whatsapp          text not null,
  event_name        text,
  city              text,
  payment_url       text,
  created_at        timestamptz not null default now()
);

-- Safe to rerun on a DB that already has the table without these columns.
alter table registrations add column if not exists category_name text;
alter table registrations add column if not exists class_year   text;
alter table registrations add column if not exists event_name   text;
alter table registrations add column if not exists payment_url  text;
-- registration_code backfill for existing tables → see content/registration-code.sql

-- Video upload feature: links a registration to the Drive file uploaded for it.
alter table registrations add column if not exists video_drive_file_id text;
alter table registrations add column if not exists video_uploaded_at   timestamptz;

create index if not exists idx_event_categories_category on event_categories(category_id);
create index if not exists idx_gallery_event on gallery_photos(event_id);

-- ---- Row Level Security ----------------------------------------------------
-- Public (anon) may READ content tables. Writes to registrations happen only
-- through the server with the service-role key, which bypasses RLS — so we add
-- NO insert policy here, keeping the anon key unable to write.

alter table categories       enable row level security;
alter table events           enable row level security;
alter table event_categories enable row level security;
alter table team_members     enable row level security;
alter table gallery_photos   enable row level security;
alter table site_content     enable row level security;
alter table results          enable row level security;
alter table registrations    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','events','event_categories','team_members',
    'gallery_photos','site_content','results'
  ] loop
    execute format(
      'drop policy if exists %I on %I; create policy %I on %I for select to anon, authenticated using (true);',
      t || '_public_read', t, t || '_public_read', t
    );
  end loop;
end $$;

-- ---- Seed: categories ------------------------------------------------------

insert into categories (id, name, sort_order) values
  ('cat-1','Class 1',1),
  ('cat-2','Class 2',2),
  ('cat-3','Class 3',3),
  ('cat-4','Class 4',4),
  ('cat-5','Class 5',5),
  ('cat-6','Class 6',6),
  ('cat-7','Class 7',7),
  ('cat-college','College Student',8),
  ('cat-professional','Working Professional',9),
  ('cat-homemaker','Homemaker',10)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

-- ---- Seed: events ----------------------------------------------------------

-- Cover banners live in Supabase Storage under the `banners/` folder of the
-- `smartmindz` bucket (uploaded manually via the dashboard). Gallery photos are
-- separate and populated by `npm run upload-gallery`.
insert into events (id, slug, title, description, event_date, location, status, cover_url) values
  ('evt-independce-fest-2026','indipendence-fest-2027','Independance Fiesta 2k26',
   'Full of talents — our upcoming celebration of creativity and skill across speeches, writing and the arts, with guaranteed certificates, trophies and grand felicitations.',
   '2026-08-15','Vaniyambadi, Tamil Nadu','upcoming',
   'https://daqtsgojquekveqnfsqq.supabase.co/storage/v1/object/public/smartmindz/banners/IndFiesta27banner.jpeg'),
  ('evt-republic-fest-2026','republic-fest-2026','Republic Fest 2026',
   'Our flagship celebration of talent — 1000+ vibrant participants across speeches, debates, essays, posters, drawing and calligraphy.',
   '2026-01-26','Vaniyambadi, Tamil Nadu','past',
   'https://daqtsgojquekveqnfsqq.supabase.co/storage/v1/object/public/smartmindz/banners/RepublicFest26banner.jpg'),
  ('mindspark-2025','mindspark-2025','MindSpark 2025',
   'Where it all came alive — packed halls, fierce competition and unforgettable performances across every category.',
   '2025-01-26','Vaniyambadi, Tamil Nadu','past',
   'https://daqtsgojquekveqnfsqq.supabase.co/storage/v1/object/public/smartmindz/banners/Mindsparkbanner.jpg')
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, description = excluded.description,
  event_date = excluded.event_date, location = excluded.location,
  status = excluded.status, cover_url = excluded.cover_url;

-- ---- Seed: event <-> category links ----------------------------------------

-- All three events are open to every category.
insert into event_categories (event_id, category_id)
select e.id, c.id
from events e cross join categories c
where e.id in ('evt-independce-fest-2026','evt-republic-fest-2026','mindspark-2025')
on conflict do nothing;

-- ---- Seed: team ------------------------------------------------------------

insert into team_members (id, name, role, photo_url, sort_order) values
  ('tm-1','Abdul Aleem','Software Engineer',null,1),
  ('tm-2','Aaqib Ameen','Software Engineer',null,2),
  ('tm-3','Khanita Mariam','Parenting Coach',null,3),
  ('tm-4','Nouman Pervez','Software Engineer',null,4),
  ('tm-5','Sajid Basha','Software Engineer',null,5),
  ('tm-6','Mohammed Sadiq','N/A',null,6)
on conflict (id) do update set
  name = excluded.name, role = excluded.role, sort_order = excluded.sort_order;

-- ---- Seed: site content (editable singletons) ------------------------------

insert into site_content (key, value) values
  ('tagline', '"Where Every Talent Shines"'),
  ('whatsappContact', '"+91-9600707610"'),
  ('whatsappGroupLink', '"https://wa.me/919600707610"'),
  ('instagram', '{"label":"Instagram","href":"https://instagram.com/smartmindz_vnb","handle":"@smartmindz_vnb"}'),
  ('youtube', '{"label":"YouTube","href":"https://www.youtube.com/@smartmindz_vnb","handle":"@smartmindz_vnb"}'),
  ('location', '"Vaniyambadi, Tamil Nadu, India"')
on conflict (key) do update set value = excluded.value;

-- Global registration on/off switch (site currently runs one shared
-- registration form, not per-event — see lib/utils.ts isRegistrationOpen).
-- `do nothing` on conflict: seeded once as the default, then this file can be
-- rerun safely without stomping a toggle you later flip from the dashboard.
-- registrationClosesAt is intentionally NOT seeded here — leaving the key
-- absent is equivalent to "no close date" and avoids a jsonb NOT NULL trap
-- (a real JSON null still needs a non-null jsonb value, e.g. '"null"'::jsonb
-- won't work either — just add the key manually in the dashboard when needed).
insert into site_content (key, value) values
  ('registrationOpen', 'true')
on conflict (key) do nothing;

-- Video upload on/off switch for the current fest's online events — same
-- shape as registrationOpen (see lib/utils.ts isVideoUploadOpen). Seeded
-- disabled: turn on only once videoUploadFolders below is actually populated
-- with real Drive folder ids, otherwise uploads have nowhere to go.
-- videoUploadClosesAt is intentionally not seeded, same reasoning as
-- registrationClosesAt above.
insert into site_content (key, value) values
  ('videoUploadEnabled', 'false'),
  ('videoUploadFolders', '{}')
on conflict (key) do nothing;

-- NOTE: gallery_photos rows are populated by `npm run upload-gallery`, which
-- compresses the images and uploads them to Supabase Storage.
