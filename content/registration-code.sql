-- ============================================================================
-- SmartMindz — 4-digit registration code for each registration
-- Run this ONCE in the Supabase SQL editor (production + staging).
--
-- Adds a short, human-friendly reference number to every registration:
--   * 4 digits, starting at 1000 and incrementing (1000, 1001, 1002, …)
--   * globally unique — a code never repeats across all registrations
--   * assigned automatically by the database on insert (atomic, no races)
--
-- Capacity: 1000–9999 = 9000 codes. The sequence has NO CYCLE, so the
-- 9001st registration will fail loudly rather than reuse a number.
-- ============================================================================

-- 1) The sequence that mints the codes.
create sequence if not exists registration_code_seq
  as integer
  minvalue 1000
  maxvalue 9999
  start with 1000;

-- 2) The column (nullable for now so we can backfill existing rows first).
alter table registrations
  add column if not exists registration_code integer;

-- 3) Backfill existing rows in registration order (earliest = lowest code).
with ordered as (
  select id, row_number() over (order by created_at, id) as rn
  from registrations
  where registration_code is null
)
update registrations r
set registration_code = 999 + o.rn
from ordered o
where r.id = o.id;

-- 4) Advance the sequence past the highest code we just assigned, so the next
--    insert continues cleanly (returns 1000 on an empty table).
select setval(
  'registration_code_seq',
  greatest(1000, coalesce((select max(registration_code) from registrations), 999) + 1),
  false
);

-- 5) Now enforce: auto-assign on insert, require it, and keep it unique.
alter table registrations
  alter column registration_code set default nextval('registration_code_seq');

alter table registrations
  alter column registration_code set not null;

alter table registrations
  add constraint registrations_registration_code_key unique (registration_code);
