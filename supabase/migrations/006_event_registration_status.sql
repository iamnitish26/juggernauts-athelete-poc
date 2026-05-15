-- Add registration_status to event_registrations
alter table public.event_registrations
  add column if not exists registration_status text not null default 'confirmed'
    check (registration_status in ('confirmed', 'pending', 'cancelled', 'waitlisted'));

-- Add organiser fields to events
alter table public.events
  add column if not exists organiser_name text,
  add column if not exists organiser_contact_phone text,
  add column if not exists organiser_contact_email text;
