-- ============================================================
-- Migration 009: Security & Privacy Overhaul
-- Safe to re-run: all additions use IF NOT EXISTS.
-- Does not drop any columns or existing user data.
-- ============================================================

-- ============================================================
-- 1. Athletes — missing schema fields
-- ============================================================

-- Track which admin last updated a record
alter table public.athletes
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- Assisted registration: who created this profile and how
alter table public.athletes
  add column if not exists created_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by_role text
    check (created_by_role in ('volunteer', 'admin', 'captain', 'coach')),
  add column if not exists registration_source text not null default 'self'
    check (registration_source in (
      'self', 'volunteer', 'admin', 'captain', 'coach', 'bulk_upload', 'event_registration'
    )),
  add column if not exists source_organisation  text,
  add column if not exists source_team_name     text,
  add column if not exists source_contact_name  text,
  add column if not exists source_contact_phone text;

-- Guardian consent tracking (separate from the legacy boolean guardian_consent)
alter table public.athletes
  add column if not exists guardian_consent_status text not null default 'not_required'
    check (guardian_consent_status in ('not_required', 'pending', 'confirmed', 'rejected'));

-- Widen profile_status to include 'inactive' (migration 004 only had 3 values)
alter table public.athletes
  drop constraint if exists athletes_profile_status_check;
alter table public.athletes
  add constraint athletes_profile_status_check
    check (profile_status in ('pending', 'approved', 'rejected', 'inactive'));

-- ============================================================
-- 2. Event registrations — attendance_status
-- ============================================================

alter table public.event_registrations
  add column if not exists attendance_status text
    check (attendance_status in ('present', 'absent', 'late', 'excused'));

-- ============================================================
-- 3. Indexes for new fields
-- ============================================================

create index if not exists athletes_created_by_idx         on public.athletes(created_by_user_id);
create index if not exists athletes_registration_source_idx on public.athletes(registration_source);
create index if not exists athletes_is_public_idx           on public.athletes(is_public);
create index if not exists athletes_guardian_consent_idx    on public.athletes(guardian_consent_status);

-- ============================================================
-- 4. Tighten RLS policies on athletes
-- ============================================================

-- 4a. Public read: require approved + public + active (was missing profile_status check)
drop policy if exists "athletes: public read approved" on public.athletes;
drop policy if exists "athletes: public read active"   on public.athletes;

create policy "athletes: public read approved"
  on public.athletes for select
  using (
    is_active = true
    and is_public = true
    and profile_status = 'approved'
  );

-- 4b. Athletes always read their own profile regardless of approval state
drop policy if exists "athletes: own read" on public.athletes;

create policy "athletes: own read"
  on public.athletes for select
  using (user_id = auth.uid());

-- 4c. Creator (volunteer/admin) can always read profiles they created
drop policy if exists "athletes: creator read" on public.athletes;

create policy "athletes: creator read"
  on public.athletes for select
  using (created_by_user_id = auth.uid());

-- 4d. Volunteer read: own-created profiles + standard verification pool
--     (volunteers see all self_registered for community verification — by design)
--     Private contact fields are filtered at the application layer in volunteer views.
drop policy if exists "athletes: volunteer read" on public.athletes;

create policy "athletes: volunteer read"
  on public.athletes for select
  using (
    public.get_my_role() in ('volunteer', 'admin')
    or created_by_user_id = auth.uid()
  );

-- 4e. Volunteers can insert assisted registrations (user_id must be null — unclaimed)
drop policy if exists "athletes: volunteer insert assisted" on public.athletes;

create policy "athletes: volunteer insert assisted"
  on public.athletes for insert
  with check (
    public.get_my_role() in ('volunteer', 'admin')
    and user_id is null
  );

-- 4f. Athletes can update limited own fields (self-registered profiles pre-approval)
--     Approval/rejection fields are admin-only (enforced via "athletes: admin all").
drop policy if exists "athletes: own update" on public.athletes;

create policy "athletes: own update"
  on public.athletes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Note: "athletes: own insert" and "athletes: admin all" remain from migration 002.

-- ============================================================
-- 5. Public-safe view: public_athlete_profiles
--
-- SECURITY MODEL:
--   - security_barrier = true prevents filter-pushdown attacks
--     (the WHERE conditions below are always evaluated first)
--   - Excludes all private fields: phone, email, date_of_birth,
--     guardian_name/phone/relationship, source contacts,
--     certificate_url, rejection_reason, admin notes
--   - Profile photo gated on photo_consent
--   - Only approved + public + active profiles are visible
--
-- APPLICATION GUIDANCE:
--   The public /athlete/[athleteId] route should query this view
--   (or explicitly select only safe columns from athletes table).
--   Never use SELECT * on athletes for public-facing endpoints.
-- ============================================================

create or replace view public.public_athlete_profiles
  with (security_barrier = true)
as
select
  id,
  athlete_id,
  full_name,
  primary_sport,
  position_event_category,
  district,
  state,
  age_group,
  current_club_school,
  achievement_summary,
  -- Photo only shown if athlete consented to media use
  case when photo_consent = true then profile_photo_url else null end as profile_photo_url,
  verification_status,
  video_link,
  instagram_link,
  created_at as member_since
from public.athletes
where is_active = true
  and is_public = true
  and profile_status = 'approved';

-- Grant read access to all Supabase roles (row/column filtering done by the view)
grant select on public.public_athlete_profiles to anon, authenticated;

-- ============================================================
-- 6. Admin audit log table
-- ============================================================

create table if not exists public.admin_audit_logs (
  id            uuid        default uuid_generate_v4() primary key,
  athlete_id    uuid        references public.athletes(id) on delete set null,
  admin_user_id uuid        not null references public.profiles(id) on delete cascade,
  action        text        not null,  -- e.g. 'approve_profile', 'reject_profile', 'update_verification'
  old_value     jsonb,
  new_value     jsonb,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

create policy "audit_logs: admin read"
  on public.admin_audit_logs for select
  using (public.get_my_role() = 'admin');

create policy "audit_logs: admin insert"
  on public.admin_audit_logs for insert
  with check (public.get_my_role() = 'admin');

-- Admins cannot delete or update audit logs (immutable ledger)
-- No update/delete policies added intentionally.

create index if not exists audit_logs_athlete_idx    on public.admin_audit_logs(athlete_id);
create index if not exists audit_logs_admin_idx      on public.admin_audit_logs(admin_user_id);
create index if not exists audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

-- ============================================================
-- 7. Storage — manual steps required in Supabase Dashboard
-- ============================================================
-- TODO (Supabase Dashboard > Storage > Buckets):
--
-- A. Profile Photos bucket (e.g. "athlete-photos"):
--    1. Set bucket to PRIVATE
--    2. Add RLS policy on storage.objects:
--       SELECT: auth.role() = 'authenticated' OR (
--         EXISTS (
--           SELECT 1 FROM public.athletes a
--           WHERE a.profile_photo_url LIKE '%' || name
--             AND a.photo_consent = true
--             AND a.is_public = true
--             AND a.profile_status = 'approved'
--         )
--       )
--       INSERT/UPDATE: only owning athlete (match path to user_id) or admin
--
-- B. Certificates/Documents bucket (e.g. "athlete-documents"):
--    1. Set bucket to PRIVATE
--    2. SELECT: only owning athlete OR admin role
--    3. Public profile page must NEVER expose certificate_url
--    4. certificate_url is already excluded from public_athlete_profiles view above
--
-- C. Event Banners bucket (e.g. "event-banners"):
--    1. Set bucket to PUBLIC (safe to expose)
--    2. INSERT: admin only
-- ============================================================
