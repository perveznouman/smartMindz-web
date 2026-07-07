-- Adds a `kind` discriminator to the existing `results` table so it can hold
-- both "rules" and "results" attachments per event (each section supports an
-- unlimited number of rows). Run this once in the Supabase SQL editor.

alter table results
  add column if not exists kind text not null default 'result';

alter table results
  drop constraint if exists results_kind_check;

alter table results
  add constraint results_kind_check check (kind in ('rule', 'result'));

create index if not exists results_event_kind_idx on results (event_id, kind);
