-- ============================================================================
-- SmartMindz — drop legacy FK columns from registrations
-- Run this ONCE in the Supabase SQL editor (production + staging).
--
-- The registration form stores human-readable values in category_name /
-- event_name (driven by lib/data/festEvents.ts). The old category_id and
-- event_id foreign-key columns are never read or written by the app anymore.
--
-- Dropping the columns automatically removes the dependent FK constraints and
-- the idx_registrations_event index. This is irreversible — any legacy id
-- values still stored in these columns are lost (the *_name columns keep the
-- readable equivalents).
-- ============================================================================

alter table registrations drop column if exists category_id;
alter table registrations drop column if exists event_id;
