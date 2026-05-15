# Juggernauts Athlete ID — Stakeholder Demo Guide

## Quick Setup

### 1. Apply All Migrations (Supabase SQL Editor)

Run in order — paste each file into the SQL Editor and execute:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_seed_data.sql
supabase/migrations/004_profile_approval.sql
supabase/migrations/005_assisted_registration.sql
supabase/migrations/006_event_registration_status.sql
supabase/migrations/007_razorpay_payment_fields.sql
supabase/migrations/008_events_extra_fields.sql
supabase/migrations/009_security_privacy_overhaul.sql
```

### 2. Seed Demo Data

Paste `supabase/seed-demo-data.sql` into the SQL Editor and run. Safe to re-run.

### 3. Create Demo User Accounts (Supabase Auth → Add User)

| Email | Password | Role | Purpose |
|---|---|---|---|
| `admin@juggernauts.in` | `Demo@1234` | admin | Full admin access |
| `volunteer@juggernauts.in` | `Demo@1234` | volunteer | Verification only |
| `athlete@juggernauts.in` | `Demo@1234` | athlete | Self-registration flow |

After creating each user in Supabase Auth, set their role in the SQL Editor:

```sql
-- Set admin role
UPDATE public.profiles SET role = 'admin'
  WHERE email = 'admin@juggernauts.in';

-- Set volunteer role
UPDATE public.profiles SET role = 'volunteer'
  WHERE email = 'volunteer@juggernauts.in';
```

---

## Demo Athlete Profiles

### Approved + Public (visible at /athlete/{id})

| Athlete ID | Name | Sport | District | Verification |
|---|---|---|---|---|
| `JG-OD-FB-2026-000001` | Rahul Majhi | Football | Sundargarh | Event Verified |
| `JG-OD-HK-2026-000001` | Priya Lakra | Hockey | Sundargarh | Event Verified |
| `JG-OD-AT-2026-000001` | Suresh Nayak | Athletics | Cuttack | Community Verified |
| `JG-OD-BD-2026-000001` | Anjali Patra | Badminton | Bhubaneswar | Event Verified |
| `JG-OD-FB-2026-000002` | Bikram Soren | Football | Keonjhar | Community Verified |
| `JG-OD-HK-2026-000002` | Deepa Hansdah | Hockey | Mayurbhanj | Community Verified |
| `JG-OD-CK-2026-000001` | Raju Behera | Cricket | Ganjam | Self Registered |
| `JG-OD-VB-2026-000001` | Sunita Pradhan | Volleyball | Sambalpur | Community Verified |
| `JG-OD-KB-2026-000001` | Manoj Tudu | Kabaddi | Koraput | Event Verified |
| `JG-OD-AR-2026-000001` | Laxmi Murmu | Archery | Mayurbhanj | Event Verified |
| `JG-OD-FB-2026-000007` | Binod Sahani | Football | Sundargarh | Community Verified |
| `JG-OD-HK-2026-000006` | Pushpa Kerketta | Hockey | Mayurbhanj | Community Verified |
| `JG-OD-CK-2026-000004` | Rakesh Mandal | Cricket | Ganjam | Community Verified |
| `JG-OD-VB-2026-000003` | Soumya Pradhan | Volleyball | Sambalpur | Event Verified |
| `JG-OD-KB-2026-000003` | Hemant Nag | Kabaddi | Koraput | Community Verified |

**Direct URLs:** `/athlete/JG-OD-FB-2026-000001` (replace ID as needed)

### Pending — "Profile Not Available" (interesting demo cases)

| Athlete ID | Name | Why Pending | Verification |
|---|---|---|---|
| `JG-OD-FB-2026-000003` | Dilip Munda | Pending admin approval | Community Verified |
| `JG-OD-AT-2026-000002` | Kavita Minz | Pending admin approval | Community Verified |
| `JG-OD-CK-2026-000002` | Meena Ekka | Pending admin approval | Event Verified |

> **Demo point:** These athletes have been verified but are NOT yet visible publicly. This shows the verification ≠ publication distinction.

### Rejected

| Athlete ID | Name | Reason |
|---|---|---|
| `JG-OD-FB-2026-000008` | Ganesh Patel | Duplicate profile |
| `JG-OD-HK-2026-000007` | Mala Roy | Incomplete consent documents |

### Inactive

| Athlete ID | Name | Reason |
|---|---|---|
| `JG-OD-AT-2026-000005` | Tarun Sethy | Relocated, deactivated at athlete's request |

---

## Demo Events

| Event | Sport | Status | Fee | URL |
|---|---|---|---|---|
| Odisha U-17 Football Championship 2026 | Football | Open | ₹95 | `/events` |
| Sundargarh Hockey Talent Camp 2026 | Hockey | Open | Free | `/events` |
| Cuttack Grassroots Athletics Trial 2026 | Athletics | Open | Free | `/events` |
| Bhubaneswar Badminton Open 2026 | Badminton | Open | ₹149 | `/events` |
| Ganjam Cricket Development Camp 2026 | Cricket | Draft | ₹199 | `/events` |
| Sambalpur Volleyball Community Cup 2026 | Volleyball | Closed | Free | `/events` |
| Mayurbhanj Archery Identification Camp 2026 | Archery | Open | Free | `/events` |
| Koraput Kabaddi Youth Cup 2026 | Kabaddi | Completed | ₹50 | `/events` |

---

## Demo Flows

### Flow 1 — Admin Approves a Profile

1. Log in as `admin@juggernauts.in`
2. Go to `/admin/athletes` → find "Dilip Munda" (`JG-OD-FB-2026-000003`)
3. Note: Status Overview panel shows "Community Verified" but profile is hidden
4. Click **Approve Public Profile**
5. Visit `/athlete/JG-OD-FB-2026-000003` — now publicly visible

### Flow 2 — Admin Rejects a Profile

1. Log in as `admin@juggernauts.in`
2. Find "Mala Roy" in admin panel
3. Click **Reject Profile** → enter rejection reason → **Confirm Rejection**

### Flow 3 — Verification vs Publication (Key UX Demo)

1. Log in as `admin@juggernauts.in`
2. Open any pending athlete with community/event verification (e.g. Kavita Minz)
3. Show the amber Status Overview panel: "Verified but not published"
4. Show **Verification Actions** card (trust badge only, does not publish)
5. Show **Profile Actions** card (this is what publishes)

### Flow 4 — Public Athlete Profile

1. Log out (or open incognito)
2. Visit `/athlete/JG-OD-BD-2026-000001` (Anjali Patra — Badminton Senior)
3. Show: achievement summary, QR code, share panel, player card download
4. Show: no phone, no email, no guardian, no exact DOB visible
5. Visit the URL for a pending athlete — shows "Profile Not Available" screen

### Flow 5 — Event Registration (Paid)

1. Log in as `athlete@juggernauts.in`
2. Complete athlete self-registration if not done (fills the self-registration form)
3. Go to `/events` → open "Odisha U-17 Football Championship 2026"
4. Click **Register** → proceeds to Razorpay (or shows "not configured" if no Razorpay keys set)

> **Note on Razorpay:** The app handles missing Razorpay credentials gracefully with a user-friendly message. To test real payments, add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env.local`.

### Flow 6 — Free Event Registration

1. Log in as `athlete@juggernauts.in`
2. Go to `/events` → open "Sundargarh Hockey Talent Camp 2026"
3. Click **Register** → instant confirmation (no payment required)

### Flow 7 — Volunteer Verification

1. Log in as `volunteer@juggernauts.in`
2. Go to `/admin/athletes`
3. Open a pending athlete → use **Verification Actions** to mark community verified
4. Note: volunteer cannot approve profiles (that requires admin)

---

## Environment Variables

Required in `.env.local` (development) or Vercel dashboard (production):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, never commit
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — required for paid event registration
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-razorpay-secret           # server-side only, never commit
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

**Security note:** `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` bypass all Row-Level Security. Never commit these to git. Store only in `.env.local` (gitignored) or Vercel environment variables.

---

## Registration Status Reference

### Athlete Profile Statuses

| Status | Visible Publicly | Description |
|---|---|---|
| `pending` | No | Submitted, awaiting admin review |
| `approved` | Yes | Approved and visible at `/athlete/{id}` |
| `rejected` | No | Rejected with reason stored |
| `inactive` | No | Deactivated (relocated, withdrawn, etc.) |

### Athlete Verification Statuses (trust badge only)

| Status | Badge | Description |
|---|---|---|
| `self_registered` | Basic | Submitted by athlete/guardian, not yet verified |
| `community_verified` | Blue | Verified by a Juggernauts volunteer |
| `event_verified` | Gold | Verified through event participation |

### Event Registration Statuses

| Status | Description |
|---|---|
| `confirmed` | Registered and payment complete (or free event) |
| `pending` | Registered but payment pending |
| `cancelled` | Cancelled by athlete or organiser |
| `waitlisted` | Event full, on waitlist |
| `failed` | Payment failed |
