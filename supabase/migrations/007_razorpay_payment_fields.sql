-- Extend event_registrations with full Razorpay payment fields

-- Add missing Razorpay columns (razorpay_order_id already exists from 001)
alter table public.event_registrations
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature  text,
  add column if not exists amount              numeric(10,2),
  add column if not exists currency            text not null default 'INR',
  add column if not exists confirmed_at        timestamptz;

-- Widen payment_status to include not_required (replaces the old 'waived' label)
alter table public.event_registrations
  drop constraint if exists event_registrations_payment_status_check;
alter table public.event_registrations
  add constraint event_registrations_payment_status_check
    check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded', 'waived'));

-- registration_status: add 'failed' value (migration 006 added the column)
alter table public.event_registrations
  drop constraint if exists event_registrations_registration_status_check;
alter table public.event_registrations
  add constraint event_registrations_registration_status_check
    check (registration_status in ('pending', 'confirmed', 'cancelled', 'waitlisted', 'failed'));

-- Service-role (API routes) must be able to update registrations after payment verification.
-- The existing "event_registrations: admin all" policy covers admin role.
-- API routes use service-role key which bypasses RLS entirely — no extra policy needed.

-- Allow athlete to update their own registration (for retry-payment scenario)
create policy "event_registrations: athlete update own"
  on public.event_registrations for update
  using (
    athlete_profile_id in (
      select id from public.athletes where user_id = auth.uid()
    )
  );
