# Juggernauts Athlete ID

A grassroots sports technology platform for young athletes in Odisha. Built for Juggernauts — a Section 8 registered sports organisation/NGO.

## What this is

Juggernauts Athlete ID gives every grassroots athlete in Odisha a unique verified digital identity. Athletes can register, build a public profile, get verified by Juggernauts volunteers, and register for events and tournaments.

**Athlete ID format:** `JG-OD-FB-2026-000001`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth + DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **Payments:** Razorpay (direct REST API, no npm package required)

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url>
cd juggernauts-athelete-poc
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_seed_data.sql`
3. Optionally, run `supabase/seed-demo-data.sql` to load 35 demo athletes, 8 events, and 25 registrations (see `DEMO.md` for full walkthrough)
4. Go to **Storage** and create a bucket named `athlete-media` (set to public)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
app/
  page.tsx                    # Landing page
  auth/
    login/page.tsx            # Login
    register/page.tsx         # Account creation (Step 1)
  athlete/
    register/page.tsx         # Athlete profile form (Step 2)
    [athleteId]/page.tsx      # Public athlete profile
  admin/
    page.tsx                  # Admin dashboard
    athletes/                 # Athlete list + detail + verify
    events/                   # Event management
    analytics/page.tsx        # Analytics dashboard
  events/
    page.tsx                  # Public event listing
    [id]/page.tsx             # Event detail + registration
  volunteer/
    page.tsx                  # Volunteer dashboard
    verify/                   # Verify athlete profiles

components/
  ui/                         # Button, Card, Badge, Input, StatCard, etc.
  layout/                     # Navbar, Footer, DashboardSidebar
  forms/                      # AthleteRegistrationForm, EventRegisterButton, etc.
  dashboard/                  # AdminVerifyActions, VolunteerVerifyActions

lib/
  supabase/
    client.ts                 # Browser Supabase client
    server.ts                 # Server Supabase client
    middleware.ts             # Auth middleware with route protection
  constants.ts                # Sports, districts, age groups
  athlete-id.ts               # Athlete ID generation helpers

types/
  index.ts                    # All TypeScript interfaces

supabase/migrations/
  001_initial_schema.sql      # Tables, triggers, sequences
  002_rls_policies.sql        # Row Level Security policies
  003_seed_data.sql           # Sports and Odisha districts seed data
```

---

## User Roles

| Role | Access |
|------|--------|
| `athlete` | Registration, own profile, event registration |
| `volunteer` | Verify pending athlete profiles (no private contact data) |
| `admin` | Full access: all athlete data, events, analytics, verification |

Set a user's role by updating `profiles.role` in Supabase directly (for now).

---

## Athlete ID Format

```
JG-OD-{SPORT_CODE}-{YEAR}-{SEQUENCE}
```

Examples:
- `JG-OD-FB-2026-000001` — Football
- `JG-OD-HK-2026-000002` — Hockey
- `JG-OD-AT-2026-000003` — Athletics

Sport codes: FB, HK, AT, CK, BD, BK, VB, KB, WR, BX, SW, TT, TN, AR, OT

---

## Privacy & Security

- **Public profile** (`/athlete/[id]`) never shows: phone, email, exact DOB, guardian details, private documents
- **Volunteer view** (`/volunteer/verify/[id]`) shows sport and district info only — no contact details
- **Admin view** shows all fields including private contact information
- Row Level Security (RLS) enforced at the database level (see `002_rls_policies.sql`)
- Guardian consent required for athletes under 18

---

## Razorpay Integration

Payments are fully implemented using direct REST API calls (no npm package).

**To enable payments:**
1. Add to `.env.local`: `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
2. Without these keys the app still works — paid events show a "Configure Razorpay" notice instead of the checkout button

**Security:**
- Amount is fetched server-side from the database (never trusted from the client)
- HMAC-SHA256 signature verified server-side before any state changes
- `RAZORPAY_KEY_SECRET` is never sent to the frontend

---

## Supabase Storage

Create a bucket called `athlete-media` in Supabase Storage. Set access to public so profile photos can be displayed without authentication.

Folder structure:
```
athlete-media/
  athletes/{user_id}/profile.jpg
  athletes/{user_id}/certificate.pdf
```

---

## Deployment on Vercel

1. Push to GitHub
2. Import in [vercel.com/new](https://vercel.com/new)
3. Add environment variables (same as `.env.local`)
4. Deploy — Vercel detects Next.js automatically

---

## Future Features (v2+)

- AI-generated player bio
- QR code attendance at events
- Digital achievement certificates
- Academy/club dashboard
- Tournament fixture generator
- WhatsApp notification integration
- CSR / government reporting dashboard
- PWA (Progressive Web App) support
- Mobile app (React Native)

---

## Local Test Accounts

After running migrations, create test accounts via Supabase Auth Dashboard or the `/auth/register` page. Then update `profiles.role` in the database:

```sql
-- Make a user admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Make a user volunteer
UPDATE profiles SET role = 'volunteer' WHERE email = 'volunteer@example.com';
```
