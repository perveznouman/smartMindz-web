-- ============================================================================
-- SmartMindz — registration columns for the Independence Fest cascade
-- Run this ONCE in the Supabase SQL editor.
--
-- The registration form now captures Category, Event (competition) and
-- Class/Year as human-readable text (driven by lib/data/festEvents.ts) rather
-- than as foreign keys to the events/categories tables. These columns store
-- those values. The legacy category_id / event_id columns are left in place
-- (nullable) for backwards compatibility.
-- ============================================================================

alter table registrations add column if not exists category_name text;
alter table registrations add column if not exists class_year   text;
alter table registrations add column if not exists event_name   text;

-- Payment screenshot: the public URL of the uploaded proof of payment.
-- The file itself is stored in Supabase Storage under the `payments/` prefix
-- of the gallery bucket (see /api/register/payment).
alter table registrations add column if not exists payment_url  text;
