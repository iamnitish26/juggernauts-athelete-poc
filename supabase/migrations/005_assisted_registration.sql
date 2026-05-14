-- 005_assisted_registration.sql
-- Add assisted registration fields and RLS policies for volunteer/admin-created profiles

-- Allow user_id to be null for assisted registrations (athlete hasn't claimed yet)
alter table public.athletes alter column user_id drop not null;

-- New columns
alter table public.athletes
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by_role text
    check (created_by_role in (
      'athlete', 'volunteer', 'admin',
      'captain', 'coach', 'academy_manager', 'event_organiser'
    )),
  add column if not exists registration_source text not null default 'self'
    check (registration_source in (
      'self', 'volunteer', 'admin', 'captain', 'coach', 'bulk_upload', 'event_registration'
    )),
  add column if not exists source_organisation text,
  add column if not exists source_team_name text,
  add column if not exists source_contact_name text,
  add column if not exists source_contact_phone text,
  add column if not exists guardian_consent_status text not null default 'not_required'
    check (guardian_consent_status in ('not_required', 'pending', 'confirmed', 'rejected'));

-- Backfill existing rows
update public.athletes
  set registration_source = 'self',
      guardian_consent_status = case
        when guardian_consent = true then 'confirmed'
        when guardian_consent = false then 'pending'
        else 'not_required'
      end
  where registration_source = 'self';

-- Indexes for new columns
create index if not exists athletes_registration_source_idx on public.athletes(registration_source);
create index if not exists athletes_created_by_user_id_idx on public.athletes(created_by_user_id);
create index if not exists athletes_guardian_consent_status_idx on public.athletes(guardian_consent_status);

-- RLS: Creators (volunteers/admins) can see the athletes they registered on behalf of
create policy "athletes: creator read" on public.athletes
  for select using (created_by_user_id = auth.uid());

-- RLS: Volunteers and admins can insert assisted profiles (user_id is null, creator is the logged-in user)
create policy "athletes: assisted insert" on public.athletes
  for insert with check (
    user_id is null
    and created_by_user_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('volunteer', 'admin')
    )
  );

-- RLS: Creators can update athletes they created while profile is still pending
create policy "athletes: creator update pending" on public.athletes
  for update using (
    created_by_user_id = auth.uid()
    and (profile_status = 'pending' or profile_status is null)
  );

-- TODO: Future bulk upload
-- Bulk upload athletes from school/college/team CSV
-- Generate Athlete IDs in batch with registration_source = 'bulk_upload'
-- All batch profiles default to profile_status = 'pending', is_public = false
-- Validate and flag guardian_consent_status = 'pending' for all minors in batch
-- Requires admin approval before any batch profile becomes public
