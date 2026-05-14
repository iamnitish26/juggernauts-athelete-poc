-- ============================================================
-- Profile approval workflow fields
-- Run in Supabase SQL Editor after 003_seed_data.sql
-- ============================================================

-- Add admin approval workflow columns to athletes table
alter table public.athletes
  add column if not exists profile_status text not null default 'pending'
    check (profile_status in ('pending', 'approved', 'rejected')),
  add column if not exists is_public boolean not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references public.profiles(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists guardian_relationship text
    check (guardian_relationship in ('parent', 'sibling', 'relative', 'coach', 'other'));

-- Backfill: treat existing active athletes as approved and public
-- (they were visible before this migration, so we preserve that)
update public.athletes
  set profile_status = 'approved', is_public = true
  where is_active = true;

-- ============================================================
-- Update RLS: public read now requires is_public = true
-- ============================================================

drop policy if exists "athletes: public read active" on public.athletes;

create policy "athletes: public read approved"
  on public.athletes for select
  using (is_active = true and is_public = true);

-- Athletes can always read their own profile (regardless of is_public)
create policy "athletes: own read"
  on public.athletes for select
  using (user_id = auth.uid());

-- ============================================================
-- Index for profile_status lookups (used in admin dashboard)
-- ============================================================
create index if not exists athletes_profile_status_idx on public.athletes(profile_status);
