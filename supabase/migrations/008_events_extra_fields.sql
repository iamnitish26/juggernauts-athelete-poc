-- Add extended fields to events table

alter table public.events
  add column if not exists start_time          time,
  add column if not exists end_time            time,
  add column if not exists event_type          text not null default 'free'
    check (event_type in ('free', 'paid')),
  add column if not exists registration_format text not null default 'individual'
    check (registration_format in ('individual', 'team')),
  add column if not exists registration_approval_mode text not null default 'auto'
    check (registration_approval_mode in ('auto', 'manual')),
  add column if not exists eligibility_criteria      text,
  add column if not exists required_documents_notes  text,
  add column if not exists google_maps_link          text,
  add column if not exists event_banner_url          text;

-- organiser_name, organiser_contact_email, organiser_contact_phone
-- were already added in migration 006. Skip if already present.

-- Backfill event_type from registration_fee for existing rows
update public.events
  set event_type = 'paid'
  where registration_fee > 0 and event_type = 'free';

-- Default organiser_name to 'Juggernauts' for rows that have none
update public.events
  set organiser_name = 'Juggernauts'
  where organiser_name is null;
