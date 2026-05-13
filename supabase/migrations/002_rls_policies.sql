-- ============================================================
-- Row Level Security Policies
-- ============================================================

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.verifications enable row level security;
alter table public.payments enable row level security;
alter table public.sports enable row level security;
alter table public.districts enable row level security;

-- Helper: get the current user's role
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- PROFILES policies
-- ============================================================
create policy "profiles: public read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: admin read all"
  on public.profiles for select
  using (public.get_my_role() = 'admin');

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- SPORTS policies (public read)
-- ============================================================
create policy "sports: public read"
  on public.sports for select
  using (true);

create policy "sports: admin write"
  on public.sports for all
  using (public.get_my_role() = 'admin');

-- ============================================================
-- DISTRICTS policies (public read)
-- ============================================================
create policy "districts: public read"
  on public.districts for select
  using (true);

create policy "districts: admin write"
  on public.districts for all
  using (public.get_my_role() = 'admin');

-- ============================================================
-- ATHLETES policies
-- ============================================================

-- Public can read SAFE fields (enforced at the application layer via a view)
create policy "athletes: public read active"
  on public.athletes for select
  using (is_active = true);

-- Athletes can update their own profile
create policy "athletes: own update"
  on public.athletes for update
  using (user_id = auth.uid());

-- Athletes can insert (registration)
create policy "athletes: own insert"
  on public.athletes for insert
  with check (user_id = auth.uid() or auth.uid() is null);

-- Volunteers can read (for verification; private fields still visible to them)
create policy "athletes: volunteer read"
  on public.athletes for select
  using (public.get_my_role() in ('volunteer', 'admin'));

-- Admin full access
create policy "athletes: admin all"
  on public.athletes for all
  using (public.get_my_role() = 'admin');

-- ============================================================
-- EVENTS policies
-- ============================================================
create policy "events: public read open"
  on public.events for select
  using (status in ('open', 'closed', 'completed'));

create policy "events: admin all"
  on public.events for all
  using (public.get_my_role() = 'admin');

-- ============================================================
-- EVENT REGISTRATIONS policies
-- ============================================================
create policy "event_registrations: athlete read own"
  on public.event_registrations for select
  using (
    athlete_profile_id in (
      select id from public.athletes where user_id = auth.uid()
    )
  );

create policy "event_registrations: athlete insert own"
  on public.event_registrations for insert
  with check (
    athlete_profile_id in (
      select id from public.athletes where user_id = auth.uid()
    )
  );

create policy "event_registrations: volunteer/admin read"
  on public.event_registrations for select
  using (public.get_my_role() in ('volunteer', 'admin'));

create policy "event_registrations: admin all"
  on public.event_registrations for all
  using (public.get_my_role() = 'admin');

-- ============================================================
-- VERIFICATIONS policies
-- ============================================================
create policy "verifications: volunteer/admin read"
  on public.verifications for select
  using (public.get_my_role() in ('volunteer', 'admin'));

create policy "verifications: volunteer/admin insert"
  on public.verifications for insert
  with check (public.get_my_role() in ('volunteer', 'admin'));

-- ============================================================
-- PAYMENTS policies
-- ============================================================
create policy "payments: athlete read own"
  on public.payments for select
  using (
    athlete_id in (
      select id from public.athletes where user_id = auth.uid()
    )
  );

create policy "payments: admin all"
  on public.payments for all
  using (public.get_my_role() = 'admin');
