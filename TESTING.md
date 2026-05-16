# Testing Guide — Juggernauts Athlete ID

## Prerequisites

1. Supabase project running with all migrations applied (001–003)
2. Demo seed data loaded (`supabase/seed-demo-data.sql`)
3. Three test accounts created (see `DEMO.md` for exact SQL):
   - `admin@juggernauts.in` / `Demo@1234` (role: admin)
   - `volunteer@juggernauts.in` / `Demo@1234` (role: volunteer)
   - `athlete@juggernauts.in` / `Demo@1234` (role: athlete)

---

## Critical Test Flows

### 1. Public Athlete Profile Privacy

**Goal:** Confirm private data never leaks to `/athlete/[athleteId]`.

1. Open any public athlete URL (e.g. `/athlete/JG-OD-FB-2026-000001`) **without being logged in**
2. Verify the page shows: name, sport, district, age group, verification badge
3. Verify the page does **NOT** show: phone number, email, date of birth, guardian name, guardian phone

**Pass criteria:** No contact fields visible. Address/DOB section absent.

---

### 2. Profile Approval Gate

**Goal:** Confirm pending/rejected/inactive profiles are not publicly accessible.

1. Find a pending athlete ID from the admin panel (e.g. `JG-OD-AT-2026-000011`)
2. Try visiting `/athlete/JG-OD-AT-2026-000011` while not logged in
3. Expect: "Profile not available" message, not the profile data

**Pass criteria:** Page shows the "not available" state, no athlete data visible.

---

### 3. Admin Role Protection

**Goal:** Confirm `/admin/*` routes reject non-admins.

1. Log in as `volunteer@juggernauts.in`
2. Navigate to `/admin`
3. Expect: redirect to `/`

1. Log out
2. Navigate to `/admin`
3. Expect: redirect to `/auth/login`

**Pass criteria:** Both redirects work correctly.

---

### 4. Volunteer Role Protection

**Goal:** Confirm `/volunteer/*` routes reject unauthenticated users.

1. Log out completely
2. Navigate to `/volunteer`
3. Expect: redirect to `/auth/login`

1. Log in as `athlete@juggernauts.in`
2. Navigate to `/volunteer`
3. Expect: redirect to `/`

**Pass criteria:** Both redirects work correctly.

---

### 5. Volunteer Privacy Check

**Goal:** Confirm volunteers cannot see athlete contact details.

1. Log in as `volunteer@juggernauts.in`
2. Go to `/volunteer/verify`
3. Click "Review" on any athlete
4. Verify the page shows: name, sport, district, age group, verification status
5. Verify the page does **NOT** show: phone, email, exact DOB, guardian info

**Pass criteria:** "Private contact details are hidden from volunteers" note is visible; no contact fields shown.

---

### 6. Volunteer Cannot Re-verify

**Goal:** Confirm volunteers cannot change an already-verified athlete.

1. Log in as `volunteer@juggernauts.in`
2. Go to `/volunteer/verify?status=community_verified` (append query param)
3. Click "Review" on a community-verified athlete
4. Expect: "This profile has already been actioned. Only admins can change it further." — no action buttons

**Pass criteria:** Buttons are absent; message shown.

---

### 7. Admin Athlete Approval Workflow

**Goal:** Approve a pending athlete and confirm it becomes publicly visible.

1. Log in as `admin@juggernauts.in`
2. Go to `/admin/athletes` and find a Pending athlete
3. Click into the athlete detail page
4. Click "Approve" and set `is_public = true`
5. Navigate to the athlete's public URL (`/athlete/{athlete_id}`)
6. Confirm the full profile is visible

**Pass criteria:** Profile renders publicly after approval.

---

### 8. Event Registration (Free Event)

**Goal:** Register for a free event end-to-end.

1. Log in as `athlete@juggernauts.in`
2. Go to `/events` and open any open free event
3. Click "Register Now"
4. Confirm registration — status should immediately show as "confirmed" with payment "not_required"

**Pass criteria:** Registration confirmed without payment step.

---

### 9. Event Registration (Paid Event — Razorpay not configured)

**Goal:** Paid event shows appropriate notice when Razorpay keys are absent.

1. Log in as `athlete@juggernauts.in`
2. Find the "Odisha U-17 Football Championship" (₹95 fee) in `/events`
3. Expect: "Configure Razorpay to enable payments" message instead of checkout

**Pass criteria:** Graceful degradation; no errors thrown.

---

### 10. Admin Export CSV

**Goal:** CSV export contains correct columns.

1. Log in as `admin@juggernauts.in`
2. Go to `/admin/events`
3. Click the `⋮` menu on any event → "Export CSV"
4. Open the downloaded file
5. Verify columns: Athlete Name, Athlete ID, Registration Status, Payment Status, Amount (₹), Razorpay Payment ID, Registered At, Confirmed At

**Pass criteria:** CSV downloads; 8 columns present; no raw UUIDs in "Athlete ID" column.

---

### 11. Admin Analytics

**Goal:** Charts render without errors.

1. Log in as `admin@juggernauts.in`
2. Go to `/admin/analytics`
3. Verify: sport distribution bars, district bar chart, registration trend line, verification funnel, payment summary all render

**Pass criteria:** No blank chart areas; no JS console errors.

---

## Code Quality Checks

```bash
# Lint (should show 0 errors)
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```

Expected: `npm run lint` → 0 errors; `npm run build` → exit 0.

---

## Mobile Responsiveness

Test these routes at 390px width (iPhone 14 viewport):

| Route | Check |
|-------|-------|
| `/admin` | Hamburger menu visible; sidebar hidden |
| `/admin/athletes` | Cards stack vertically; names truncate not overflow |
| `/admin/events` | Event rows readable; action menu accessible |
| `/admin/events/[id]` | Registration table switches to card view |
| `/volunteer` | Stats grid 2-column; athlete list readable |
| `/volunteer/verify` | Search inputs full-width; single-column stacked |

Tap hamburger → drawer slides in → tap link → drawer closes. ✓

---

## Known Limitations (POC Scope)

- **Guardian consent** is self-attested via checkbox only (no OTP/SMS verification)
- **Razorpay webhook** not implemented; verification is client-triggered only
- **Email format validation** in registration form is browser-native only (no server-side regex)
- **Role assignment** is manual via SQL (no admin UI to change user roles)
- **Photo/certificate upload** uses Supabase Storage; bucket must be manually created
