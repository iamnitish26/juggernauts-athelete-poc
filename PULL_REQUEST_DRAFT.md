# PR Title

feat(camps): add JSF Camp Verified Module 1 — football assessment camps with structured scoring

## Summary

Adds a complete football assessment camp management system to the Juggernauts Athlete ID platform. Admins can create and manage camps, register athletes, record test results and coach assessments, calculate cohort-relative scores, assign JSF recommendation categories, and export results as CSV. Verified athletes receive a Camp Verified badge on their public profile.

## Why

The JSF Camp Verified badge is the core trust signal of the platform. Scouts and partner organisations need a structured, reproducible way to evaluate grassroots athletes across Odisha. This module establishes the football assessment framework that all future sport-specific modules will follow.

## Key Features

- **100-point scoring model** across 5 categories: Athletic Base (25), Technical Skill (35), Game/Coach Assessment (25), Development Potential (10), Data Confidence (5)
- **Cohort-relative percentile scoring** — each athlete is ranked within their own camp + age group + gender cohort, preventing cross-camp comparisons
- **4 recommendation categories**: JSF Recommended, JSF Watchlist, Development Track, Participation Track (language kept as "Recommended for further evaluation" — no guarantees)
- **Admin camp CRUD**: create, edit, advance status (Draft → Open → Completed)
- **Participant management**: search and add athletes, track attendance status (Registered / Attended / Absent / Withdrawn)
- **Per-athlete results entry**: 3-attempt inputs per test with automatic best-value selection
- **Coach assessment form**: 9 scoring fields (1–5), potential flag, public summary, private notes
- **One-click score calculation**: calls server-side API that loads cohort, computes percentiles, upserts scores, advances verification status
- **CSV export**: shortlist (scored athletes only) and full (all test values + sub-scores) — no private fields exposed
- **Public profile Camp Verified badge**: gated on `profile_status = approved`, `is_public = true`, and `public_summary_enabled = true` per participant
- **Camp Verified analytics section** in admin analytics page
- **Demo seed data**: 2 camps, 14 participants, test results, pre-calculated scores ready for local testing

## Database Changes

Migration: `supabase/migrations/010_camp_verified.sql`

### New tables

| Table | Purpose |
|---|---|
| `camps` | Camp records (name, sport, district, venue, date, status) |
| `camp_participants` | Athlete ↔ camp join with attendance, verification status, rating, recommendation |
| `test_definitions` | Reusable test templates (sprint, agility, Yo-Yo, dribble, passing, shooting) |
| `test_results` | Per-athlete per-test values (3 attempts, best, percentile, score/10) |
| `coach_assessments` | 9 coach scoring fields + potential flag + public/private notes |
| `athlete_camp_scores` | Calculated sub-scores and final 100-point score per athlete per camp |

### Columns added to existing table

`athletes`: `latest_camp_verified_at`, `latest_camp_rating`, `latest_recommendation_category`

### Constraints

- `camp_participants`: unique `(camp_id, athlete_id)`
- `athlete_camp_scores`: unique `(camp_id, athlete_id)`
- `test_results`: unique `(camp_id, athlete_id, test_definition_id)`
- `coach_assessments`: unique `(camp_id, athlete_id)`

### Seeded test definitions (fixed UUIDs, safe to re-seed)

| Test | UUID prefix | lower_is_better |
|---|---|---|
| 30m Sprint | td000001-... | true |
| 5-10-5 Agility | td000002-... | true |
| Yo-Yo / Beep Test | td000003-... | false |
| Dribble Slalom | td000004-... | true |
| Passing Accuracy | td000005-... | false |
| Shooting Accuracy | td000006-... | false |

### RLS policies

- Admins: full read/write on all camp tables
- Volunteers: read-only on camps + participants + scores
- Athletes/public: no direct access to camp tables (public data served via profile page query)

## Routes Added or Updated

| Route | Type | Description |
|---|---|---|
| `/admin/camps` | Page | Camp list with status filters and participant counts |
| `/admin/camps/new` | Page | Create camp form |
| `/admin/camps/[id]` | Page | Camp detail dashboard (stats, data completion, recommendation summary) |
| `/admin/camps/[id]/edit` | Page | Edit camp form |
| `/admin/camps/[id]/participants` | Page | Participant list with attendance and scoring status |
| `/admin/camps/[id]/results/[athleteId]` | Page | Per-athlete test results + coach assessment + score calculation |
| `POST /api/camps/[campId]/calculate/[athleteId]` | API | Calculate cohort-relative score, upsert results, update athlete record |
| `GET /api/camps/[campId]/export?type=shortlist\|full` | API | Download scored results as CSV |
| `/athlete/[athleteId]` | Updated | Camp Verified badge added to public profile |
| `/admin/analytics` | Updated | Camp Verified stats section added |

## Privacy and Safety

- CSV export never includes: phone, email, guardian details, exact DOB, private notes, rejection reasons
- Camp Verified badge on public profile requires three independent gates: `profile_status = approved` AND `is_public = true` AND `public_summary_enabled = true`
- Private coach notes are rendered only on the admin results page — not in any public-facing query
- All recommendation language uses "Recommended for further evaluation" — no guarantee language
- `small_cohort_warning` is surfaced in admin views and export when cohort size < 5, but scoring still proceeds
- Calculate API is admin-only (role check enforced server-side)
- Export API is admin-only (role check enforced server-side)

## Testing Performed

```bash
npx tsc --noEmit   # 0 errors
npm run lint       # (run manually — fix any lint warnings before merge)
npm run build      # (run manually before merge)
```

Manual QA checklist:
- [ ] Create a new camp, verify it appears in camp list
- [ ] Add athletes to the camp via participant search
- [ ] Toggle attendance status (Registered → Attended → Absent → Withdrawn)
- [ ] Enter 3 attempts for each test on the results page
- [ ] Submit coach assessment
- [ ] Calculate score — verify rating and recommendation appear
- [ ] Toggle `public_summary_enabled` and check public profile badge appears/disappears
- [ ] Export shortlist CSV — confirm no private fields
- [ ] Export full CSV — confirm all test values and sub-scores present
- [ ] Advance camp status: Draft → Open → Completed
- [ ] View Camp Verified section on `/admin/analytics`

## Screenshots to Attach

- `/admin/camps` — camp list (desktop + mobile)
- `/admin/camps/new` — create camp form
- `/admin/camps/[id]` — camp detail dashboard
- `/admin/camps/[id]/participants` — participant list with scoring status
- `/admin/camps/[id]/results/[athleteId]` — test results + coach assessment
- Public athlete profile with Camp Verified badge
- `/admin/analytics` — Camp Verified stats section
- Shortlist CSV download
- Full results CSV download

## Known Limitations

- Only Football is supported (sport field is hard-coded to "Football" in Module 1)
- Age-group-specific scoring weights are stubbed with TODOs — currently uniform across all age groups
- No email/SMS notification when a camp score is calculated
- No bulk score calculation (must calculate one athlete at a time)
- No camp-to-camp comparison view
- `small_cohort_warning` is informational only — no automated suppression of low-confidence scores

## Follow-up Work

- **Module 2**: Athletics camp module with discipline-specific tests
- **Module 3**: Hockey camp module
- Age-group-specific scoring weights (U-13 vs Senior weighting differs)
- Bulk calculate all participants in a camp
- Coach notification when athlete is JSF Recommended
- Camp-level aggregate statistics page
- Integrate camp recommendation into athlete profile approval workflow
- Volunteer-facing camp scoring UI (currently admin-only)
