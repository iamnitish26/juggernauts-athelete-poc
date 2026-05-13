-- ============================================================
-- Juggernauts Athlete ID — Initial Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'athlete' check (role in ('athlete', 'volunteer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SPORTS
-- ============================================================
create table if not exists public.sports (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  code char(2) not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DISTRICTS
-- ============================================================
create table if not exists public.districts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  state text not null default 'Odisha',
  created_at timestamptz not null default now(),
  unique (name, state)
);

-- ============================================================
-- ATHLETES
-- ============================================================
create table if not exists public.athletes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  athlete_id text not null unique,

  -- Basic details
  full_name text not null,
  gender text not null check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  date_of_birth date not null,
  age_group text not null check (age_group in ('U-13', 'U-15', 'U-17', 'U-19', 'Senior')),
  state text not null default 'Odisha',
  district text not null,
  city_block text,
  profile_photo_url text,
  photo_consent boolean not null default false,

  -- Sport details
  primary_sport text not null,
  sport_id uuid references public.sports(id) on delete set null,
  position_event_category text,
  dominant_side text,
  current_club_school text,
  years_of_experience integer check (years_of_experience >= 0),

  -- Contact (private — not exposed in public queries)
  athlete_phone text,
  athlete_email text,
  guardian_name text,
  guardian_phone text,

  -- Achievements
  achievement_summary text,
  certificate_url text,
  video_link text,
  instagram_link text,

  -- Consent
  data_consent boolean not null default false,
  guardian_consent boolean,

  -- Verification
  verification_status text not null default 'self_registered'
    check (verification_status in ('self_registered', 'community_verified', 'event_verified', 'rejected')),
  verification_notes text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ATHLETE ID SEQUENCE (for unique sequential IDs per sport per year)
-- ============================================================
create table if not exists public.athlete_id_sequences (
  sport_code char(2) not null,
  year integer not null,
  last_sequence integer not null default 0,
  primary key (sport_code, year)
);

create or replace function public.next_athlete_sequence(p_sport_code char(2), p_year integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_seq integer;
begin
  insert into public.athlete_id_sequences (sport_code, year, last_sequence)
  values (p_sport_code, p_year, 1)
  on conflict (sport_code, year) do update
    set last_sequence = public.athlete_id_sequences.last_sequence + 1
  returning last_sequence into v_seq;
  return v_seq;
end;
$$;

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sport text not null,
  sport_id uuid references public.sports(id) on delete set null,
  event_date date not null,
  venue text not null,
  district text not null,
  age_category text not null,
  registration_fee numeric(10,2) not null default 0,
  registration_deadline date not null,
  max_participants integer,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed', 'completed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- EVENT REGISTRATIONS
-- ============================================================
create table if not exists public.event_registrations (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  athlete_profile_id uuid not null references public.athletes(id) on delete cascade,
  athlete_id text not null,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'waived')),
  payment_id text,
  razorpay_order_id text,  -- TODO: populate when Razorpay is integrated
  attendance_marked boolean not null default false,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, athlete_profile_id)
);

-- ============================================================
-- VERIFICATIONS (audit trail)
-- ============================================================
create table if not exists public.verifications (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  verified_by uuid not null references public.profiles(id) on delete cascade,
  previous_status text not null,
  new_status text not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS (placeholder for Razorpay)
-- ============================================================
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid references public.athletes(id) on delete set null,
  event_registration_id uuid references public.event_registrations(id) on delete set null,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  razorpay_order_id text,       -- TODO: populate on Razorpay order create
  razorpay_payment_id text,     -- TODO: populate on Razorpay webhook
  razorpay_signature text,      -- TODO: verify HMAC signature
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger athletes_updated_at before update on public.athletes
  for each row execute procedure public.set_updated_at();

create trigger events_updated_at before update on public.events
  for each row execute procedure public.set_updated_at();

create trigger event_registrations_updated_at before update on public.event_registrations
  for each row execute procedure public.set_updated_at();

create trigger payments_updated_at before update on public.payments
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists athletes_district_idx on public.athletes(district);
create index if not exists athletes_sport_idx on public.athletes(primary_sport);
create index if not exists athletes_status_idx on public.athletes(verification_status);
create index if not exists athletes_user_id_idx on public.athletes(user_id);
create index if not exists event_registrations_event_idx on public.event_registrations(event_id);
create index if not exists event_registrations_athlete_idx on public.event_registrations(athlete_profile_id);
