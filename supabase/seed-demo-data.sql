-- ============================================================
-- Juggernauts Athlete ID — Demo Seed Data
-- Run in Supabase SQL Editor AFTER all migrations (001–009)
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- Widen profile_status to include 'inactive' (migration 009 does this,
-- but we guard here so the seed works even if 009 was skipped)
alter table public.athletes drop constraint if exists athletes_profile_status_check;
alter table public.athletes add constraint athletes_profile_status_check
  check (profile_status in ('pending', 'approved', 'rejected', 'inactive'));

-- ============================================================
-- SPORTS (upsert core sports used by demo athletes)
-- ============================================================
insert into public.sports (id, name, code, is_active) values
  ('s0000001-0000-0000-0000-000000000000', 'Football',   'FB', true),
  ('s0000002-0000-0000-0000-000000000000', 'Hockey',     'HK', true),
  ('s0000003-0000-0000-0000-000000000000', 'Athletics',  'AT', true),
  ('s0000004-0000-0000-0000-000000000000', 'Badminton',  'BD', true),
  ('s0000005-0000-0000-0000-000000000000', 'Cricket',    'CK', true),
  ('s0000006-0000-0000-0000-000000000000', 'Volleyball', 'VB', true),
  ('s0000007-0000-0000-0000-000000000000', 'Kabaddi',    'KB', true),
  ('s0000008-0000-0000-0000-000000000000', 'Archery',    'AR', true),
  ('s0000009-0000-0000-0000-000000000000', 'Swimming',   'SW', true),
  ('s0000010-0000-0000-0000-000000000000', 'Basketball', 'BB', true)
on conflict (code) do nothing;

-- ============================================================
-- ATHLETES — 35 demo profiles across states and sports
--
-- Status distribution:
--   Approved + Public (15):  a0000001–a0000010, a0000028–a0000029, a0000033–a0000035
--   Pending (17):            a0000011–a0000027
--   Rejected (2):            a0000030–a0000031
--   Inactive (1):            a0000032
--
-- Assisted registrations:    a0000022–a0000029, a0000033–a0000035
-- ============================================================

insert into public.athletes (
  id, athlete_id, user_id,
  full_name, gender, date_of_birth, age_group,
  district, state,
  primary_sport, position_event_category,
  achievement_summary, instagram_link, video_link,
  data_consent, photo_consent,
  verification_status,
  profile_status, is_public, approved_at,
  registration_source, guardian_consent_status,
  created_by_role, is_active
) values

-- ──────────────────────────────────────────────────────────────
-- APPROVED + PUBLIC (a0000001–a0000010) — individually self-registered
-- ──────────────────────────────────────────────────────────────

(
  'a0000001-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000001', null,
  'Rahul Majhi', 'male', '2009-03-14', 'U-17',
  'Sundargarh', 'Odisha',
  'Football', 'Centre Midfielder',
  'District champion 2024. Selected for Odisha U-17 state trials. Represented Sundargarh in three inter-district tournaments.',
  '@rahulmajhi_football', null,
  true, true,
  'event_verified',
  'approved', true, '2026-01-10 09:00:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000002-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000001', null,
  'Priya Lakra', 'female', '2011-07-22', 'U-15',
  'Sundargarh', 'Odisha',
  'Hockey', 'Forward',
  'State U-15 gold medallist 2025. Part of Sundargarh District Hockey Academy. Scored 12 goals in inter-school tournament.',
  null, null,
  true, true,
  'event_verified',
  'approved', true, '2026-01-12 10:30:00+05:30',
  'self', 'confirmed',
  'athlete', true
),
(
  'a0000003-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000001', null,
  'Suresh Nayak', 'male', '2007-11-05', 'U-19',
  'Cuttack', 'Odisha',
  'Athletics', '400m / 800m',
  'Odisha U-19 400m bronze (2025). Personal best 400m: 49.8s. Qualified for East Zone Athletics Meet.',
  '@suresh_runs', 'https://youtu.be/demo-suresh-track',
  true, false,
  'community_verified',
  'approved', true, '2026-01-15 11:00:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000004-0000-0000-0000-000000000000', 'JG-OD-BD-2026-000001', null,
  'Anjali Patra', 'female', '2002-04-18', 'Senior',
  'Bhubaneswar', 'Odisha',
  'Badminton', 'Singles',
  'State Senior Women''s champion 2024 and 2025. Ranked 3rd in East Zone badminton circuit. Trained at Gopichand Academy satellite camp.',
  '@anjali_smash', null,
  true, true,
  'event_verified',
  'approved', true, '2026-01-18 09:15:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000005-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000002', null,
  'Bikram Soren', 'male', '2009-09-01', 'U-17',
  'Keonjhar', 'Odisha',
  'Football', 'Striker',
  'Top scorer in Keonjhar district school league with 18 goals. Participated in Bhubaneswar FC grassroots camp 2025.',
  null, null,
  true, true,
  'community_verified',
  'approved', true, '2026-01-20 14:00:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000006-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000002', null,
  'Deepa Hansdah', 'female', '2013-02-28', 'U-13',
  'Mayurbhanj', 'Odisha',
  'Hockey', 'Goalkeeper',
  'Won best goalkeeper award at Mayurbhanj Sub-Junior tournament 2025. Selected for district training camp.',
  null, null,
  true, false,
  'community_verified',
  'approved', true, '2026-01-22 10:00:00+05:30',
  'self', 'confirmed',
  'athlete', true
),
(
  'a0000007-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000001', null,
  'Raju Behera', 'male', '2009-06-11', 'U-17',
  'Ganjam', 'Odisha',
  'Cricket', 'All-Rounder',
  'Selected for Ganjam District Cricket Association U-17 squad. Scored 320 runs and took 24 wickets in the district league season.',
  null, null,
  true, true,
  'self_registered',
  'approved', true, '2026-01-25 15:30:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000008-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000001', null,
  'Sunita Pradhan', 'female', '2007-08-14', 'U-19',
  'Sambalpur', 'Odisha',
  'Volleyball', 'Setter',
  'Captain of Sambalpur University Women''s Volleyball team. Led team to inter-university silver in 2024. State U-19 camp attendee.',
  '@sunita_vball', null,
  true, true,
  'community_verified',
  'approved', true, '2026-01-28 09:45:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000009-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000001', null,
  'Manoj Tudu', 'male', '2000-12-20', 'Senior',
  'Koraput', 'Odisha',
  'Kabaddi', 'Raider',
  'Koraput district Kabaddi champion 3 years running (2023–2025). State Senior circuit participant. Known for high-speed raiding technique.',
  null, 'https://youtu.be/demo-manoj-kabaddi',
  true, true,
  'event_verified',
  'approved', true, '2026-02-01 10:00:00+05:30',
  'self', 'not_required',
  'athlete', true
),
(
  'a0000010-0000-0000-0000-000000000000', 'JG-OD-AR-2026-000001', null,
  'Laxmi Murmu', 'female', '2011-05-03', 'U-15',
  'Mayurbhanj', 'Odisha',
  'Archery', 'Recurve',
  'Tribal talent programme participant. Silver at Odisha Sub-Junior Archery Championship 2025. Mentored by SAI-recognised coach.',
  null, null,
  true, false,
  'event_verified',
  'approved', true, '2026-02-03 11:30:00+05:30',
  'self', 'confirmed',
  'athlete', true
),

-- ──────────────────────────────────────────────────────────────
-- PENDING — self-registered, not yet reviewed (a0000011–a0000021)
-- ──────────────────────────────────────────────────────────────

(
  'a0000011-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000003', null,
  'Dilip Munda', 'male', '2009-01-17', 'U-17',
  'Sundargarh', 'Odisha',
  'Football', 'Left Winger',
  'District school team captain. Known for pace and crossing ability.',
  null, null,
  true, true,
  'community_verified',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000012-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000002', null,
  'Kavita Minz', 'female', '2009-04-09', 'U-17',
  'Kandhamal', 'Odisha',
  'Athletics', 'Long Jump / Triple Jump',
  'District long jump champion. PB 5.32m. Coached by school PT instructor.',
  null, null,
  true, false,
  'community_verified',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000013-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000003', null,
  'Santosh Das', 'male', '2000-08-31', 'Senior',
  'Rourkela', 'Odisha',
  'Hockey', 'Defender',
  'Rourkela club hockey player for 5 seasons. Participated in Hockey India League community trials.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000014-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000002', null,
  'Meena Ekka', 'female', '2009-10-12', 'U-17',
  'Sundargarh', 'Odisha',
  'Cricket', 'Spinner',
  'Took 19 wickets for school team in inter-district cricket 2025. Aspires to represent Odisha women''s team.',
  null, null,
  true, true,
  'event_verified',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000015-0000-0000-0000-000000000000', 'JG-OD-BD-2026-000002', null,
  'Pranab Giri', 'male', '2007-02-14', 'U-19',
  'Bhubaneswar', 'Odisha',
  'Badminton', 'Doubles',
  'State U-19 doubles finalist 2024. Trains at a badminton academy in Bhubaneswar.',
  '@pranab_badminton', null,
  true, true,
  'self_registered',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000016-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000004', null,
  'Biren Naik', 'male', '2004-07-25', 'Senior',
  'Koraput', 'Odisha',
  'Football', 'Central Defender',
  'Plays for Koraput district team. Has represented tribal sports federation in football events.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000017-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000004', null,
  'Sarita Topno', 'female', '2011-11-30', 'U-15',
  'Keonjhar', 'Odisha',
  'Hockey', 'Centre-half',
  'School hockey team vice-captain. Runner-up in sub-junior state hockey 2025.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'self', 'confirmed',
  'athlete', true
),
(
  'a0000018-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000003', null,
  'Rajesh Kumar', 'male', '2007-03-08', 'U-19',
  'Puri', 'Odisha',
  'Athletics', '100m / 200m',
  'District sprinting champion. 100m PB 11.2s. Aiming for state championship.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000019-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000003', null,
  'Deepak Mallick', 'male', '2009-08-19', 'U-17',
  'Cuttack', 'Odisha',
  'Cricket', 'Batsman',
  'Scored 450 runs in the local T20 league. Attended BCCI NCA grassroots camp 2024.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000020-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000005', null,
  'Ritu Sahu', 'female', '2011-01-22', 'U-15',
  'Sambalpur', 'Odisha',
  'Football', 'Right Winger',
  'School team forward. Participated in AIFF grassroots women''s football programme.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'self', 'confirmed',
  'athlete', true
),
(
  'a0000021-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000005', null,
  'Sushma Oram', 'female', '2013-06-04', 'U-13',
  'Mayurbhanj', 'Odisha',
  'Hockey', 'Forward',
  'Recently joined district sub-junior hockey camp. Shows strong potential.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'self', 'confirmed',
  'athlete', true
),

-- ──────────────────────────────────────────────────────────────
-- PENDING — assisted registrations (a0000022–a0000027)
-- ──────────────────────────────────────────────────────────────

(
  'a0000022-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000004', null,
  'Anita Sahoo', 'female', '2009-12-15', 'U-17',
  'Kendrapara', 'Odisha',
  'Athletics', 'Javelin',
  'Identified at school sports day. Javelin throw PB 28m. Registered by district athletics volunteer.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'volunteer', 'not_required',
  'volunteer', true
),
(
  'a0000023-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000002', null,
  'Kumar Biswal', 'male', '2002-05-17', 'Senior',
  'Balasore', 'Odisha',
  'Volleyball', 'Middle Blocker',
  'Club volleyball player in Balasore. Registered by team coach for district identification.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'coach', 'not_required',
  'coach', true
),
(
  'a0000024-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000002', null,
  'Reena Panda', 'female', '2011-09-03', 'U-15',
  'Nabarangpur', 'Odisha',
  'Kabaddi', 'Defender',
  'Emerging kabaddi talent from tribal sports programme. Registered by team captain.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'captain', 'confirmed',
  'captain', true
),
(
  'a0000025-0000-0000-0000-000000000000', 'JG-OD-AR-2026-000002', null,
  'Subhas Barik', 'male', '2009-02-28', 'U-17',
  'Dhenkanal', 'Odisha',
  'Archery', 'Compound',
  'Self-taught archer. District scout identified during school annual sports. Potential for nurturing.',
  null, null,
  true, false,
  'self_registered',
  'pending', false, null,
  'volunteer', 'not_required',
  'volunteer', true
),
(
  'a0000026-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000006', null,
  'Jayanti Jena', 'female', '2007-07-19', 'U-19',
  'Bhubaneswar', 'Odisha',
  'Football', 'Goalkeeper',
  'College women''s football team goalkeeper. Registered by college sports admin for visibility.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'admin', 'not_required',
  'admin', true
),
(
  'a0000027-0000-0000-0000-000000000000', 'JG-OD-BB-2026-000001', null,
  'Sanjay Nanda', 'male', '2007-10-11', 'U-19',
  'Bhubaneswar', 'Odisha',
  'Basketball', 'Point Guard',
  'College basketball team starter. Volunteered in state U-19 selection trial.',
  null, null,
  true, true,
  'self_registered',
  'pending', false, null,
  'volunteer', 'not_required',
  'volunteer', true
),

-- ──────────────────────────────────────────────────────────────
-- APPROVED + PUBLIC — assisted registrations (a0000028–a0000029)
-- ──────────────────────────────────────────────────────────────

(
  'a0000028-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000007', null,
  'Binod Sahani', 'male', '2009-05-06', 'U-17',
  'Sundargarh', 'Odisha',
  'Football', 'Attacking Midfielder',
  'Registered by academy coach. State U-17 camp invite 2025. Strong technical skills and vision.',
  null, null,
  true, true,
  'community_verified',
  'approved', true, '2026-02-10 09:00:00+05:30',
  'coach', 'not_required',
  'coach', true
),
(
  'a0000029-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000006', null,
  'Pushpa Kerketta', 'female', '2011-03-25', 'U-15',
  'Mayurbhanj', 'Odisha',
  'Hockey', 'Right Back',
  'Registered by district volunteer. Part of Mayurbhanj sub-junior hockey programme. Clean positional sense.',
  null, null,
  true, false,
  'community_verified',
  'approved', true, '2026-02-12 11:00:00+05:30',
  'volunteer', 'confirmed',
  'volunteer', true
),

-- ──────────────────────────────────────────────────────────────
-- REJECTED (a0000030–a0000031)
-- ──────────────────────────────────────────────────────────────

(
  'a0000030-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000008', null,
  'Ganesh Patel', 'male', '2009-11-14', 'U-17',
  'Cuttack', 'Odisha',
  'Football', 'Striker',
  null,
  null, null,
  true, false,
  'self_registered',
  'rejected', false, null,
  'self', 'not_required',
  'athlete', true
),
(
  'a0000031-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000007', null,
  'Mala Roy', 'female', '2011-08-03', 'U-15',
  'Balasore', 'Odisha',
  'Hockey', 'Forward',
  null,
  null, null,
  true, false,
  'self_registered',
  'rejected', false, null,
  'self', 'confirmed',
  'athlete', true
),

-- ──────────────────────────────────────────────────────────────
-- INACTIVE (a0000032)
-- ──────────────────────────────────────────────────────────────

(
  'a0000032-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000005', null,
  'Tarun Sethy', 'male', '2004-01-30', 'Senior',
  'Bhubaneswar', 'Odisha',
  'Athletics', '1500m / 5000m',
  'Former state circuit runner. Relocated to another state. Profile marked inactive at athlete''s request.',
  null, null,
  true, false,
  'self_registered',
  'inactive', false, null,
  'self', 'not_required',
  'athlete', false
),

-- ──────────────────────────────────────────────────────────────
-- APPROVED + PUBLIC — additional (a0000033–a0000035)
-- ──────────────────────────────────────────────────────────────

(
  'a0000033-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000004', null,
  'Rakesh Mandal', 'male', '2007-04-07', 'U-19',
  'Ganjam', 'Odisha',
  'Cricket', 'Fast Bowler',
  'Registered by district sports admin. Clocked 128 km/h in trials. Selected for Odisha U-19 pace bowling camp.',
  null, 'https://youtu.be/demo-rakesh-bowl',
  true, true,
  'community_verified',
  'approved', true, '2026-02-15 10:00:00+05:30',
  'admin', 'not_required',
  'admin', true
),
(
  'a0000034-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000003', null,
  'Soumya Pradhan', 'female', '2002-09-12', 'Senior',
  'Sambalpur', 'Odisha',
  'Volleyball', 'Outside Hitter',
  'State Senior Women''s volleyball team member 2024–25. Registered by team captain. National Federation camp attendee.',
  null, null,
  true, true,
  'event_verified',
  'approved', true, '2026-02-18 14:30:00+05:30',
  'captain', 'not_required',
  'captain', true
),
(
  'a0000035-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000003', null,
  'Hemant Nag', 'male', '2009-07-22', 'U-17',
  'Koraput', 'Odisha',
  'Kabaddi', 'All-Rounder',
  'Tribal talent programme product. State U-17 kabaddi championship participant 2025. Registered by volunteer coordinator.',
  null, null,
  true, false,
  'community_verified',
  'approved', true, '2026-02-20 09:30:00+05:30',
  'volunteer', 'not_required',
  'volunteer', true
)

on conflict (athlete_id) do nothing;

-- Set rejection reason for rejected profiles
update public.athletes
  set rejected_at = '2026-02-05 10:00:00+05:30',
      rejection_reason = 'Duplicate profile detected — another profile with the same name and district already exists. Please claim or merge with existing record.'
  where id = 'a0000030-0000-0000-0000-000000000000'
    and rejection_reason is null;

update public.athletes
  set rejected_at = '2026-02-06 11:00:00+05:30',
      rejection_reason = 'Incomplete submission — guardian consent form not provided. Please re-submit with signed consent document for U-15 athletes.'
  where id = 'a0000031-0000-0000-0000-000000000000'
    and rejection_reason is null;

-- ============================================================
-- EVENTS — 8 demo events covering different statuses
-- ============================================================

insert into public.events (
  id, name, sport, event_date, venue, district,
  age_category, registration_fee, registration_deadline,
  max_participants, description, status,
  event_type, registration_format, registration_approval_mode,
  eligibility_criteria, organiser_name, organiser_contact_email,
  start_time, end_time
) values

(
  'e0000001-0000-0000-0000-000000000000',
  'Odisha U-17 Football Championship 2026',
  'Football',
  '2026-07-15',
  'Kalinga Stadium, Bhubaneswar',
  'Khurda',
  'U-17',
  95.00,
  '2026-06-30',
  120,
  'Annual U-17 football championship open to all district teams. Players born between 2009–2011 are eligible. Team and individual stats tracked. Top performers considered for Odisha state squad.',
  'open',
  'paid', 'individual', 'auto',
  'Born between 01-Jan-2009 and 31-Dec-2011. Must hold a valid school/club registration.',
  'Juggernauts Sports Foundation',
  'football@juggernauts.in',
  '09:00', '18:00'
),
(
  'e0000002-0000-0000-0000-000000000000',
  'Sundargarh Hockey Talent Camp 2026',
  'Hockey',
  '2026-06-20',
  'Sundargarh Hockey Stadium, Sundargarh',
  'Sundargarh',
  'U-15',
  0.00,
  '2026-06-10',
  80,
  'Free talent identification camp for sub-junior hockey players across Sundargarh district. Qualified coaches from Hockey India will conduct assessments. Top 20 players offered district-level training support.',
  'open',
  'free', 'individual', 'auto',
  'Born between 01-Jan-2011 and 31-Dec-2013. District of origin: Sundargarh or adjacent districts.',
  'Sundargarh District Hockey Association',
  'hockey.sundargarh@juggernauts.in',
  '07:00', '13:00'
),
(
  'e0000003-0000-0000-0000-000000000000',
  'Cuttack Grassroots Athletics Trial 2026',
  'Athletics',
  '2026-06-28',
  'Barabati Stadium, Cuttack',
  'Cuttack',
  'U-19',
  0.00,
  '2026-06-20',
  150,
  'Open athletics trial for sprints, middle distance, jumps, and throws. Individual event results recorded and shared with Odisha Athletics Association for state squad shortlisting.',
  'open',
  'free', 'individual', 'manual',
  'Age 14–19 years. Must bring valid age proof on the trial day.',
  'Juggernauts Athletics Cell',
  'athletics@juggernauts.in',
  '06:30', '12:00'
),
(
  'e0000004-0000-0000-0000-000000000000',
  'Bhubaneswar Badminton Open 2026',
  'Badminton',
  '2026-07-05',
  'Cuttack Badminton Academy Hall, Bhubaneswar',
  'Khurda',
  'Senior',
  149.00,
  '2026-06-25',
  64,
  'Open-grade badminton tournament for senior men''s and women''s singles. Knockout format. Prize money for top 4 finishers. Registration limited to 64 players — first come, first served.',
  'open',
  'paid', 'individual', 'auto',
  'Age 18 and above. Must hold a valid Badminton Association of India club registration.',
  'Bhubaneswar Badminton League',
  'badminton@juggernauts.in',
  '10:00', '20:00'
),
(
  'e0000005-0000-0000-0000-000000000000',
  'Ganjam Cricket Development Camp 2026',
  'Cricket',
  '2026-08-01',
  'DRIEMS Ground, Berhampur',
  'Ganjam',
  'U-19',
  199.00,
  '2026-07-20',
  60,
  'Residential cricket development camp spanning 5 days. Covers batting, bowling, fielding, and match simulation. BCCI-affiliated coaches. Fee includes meals and accommodation.',
  'draft',
  'paid', 'individual', 'manual',
  'Age 15–19 years. Must have played at least one inter-school or district cricket match in the past 12 months.',
  'Ganjam Cricket Development Society',
  'cricket.ganjam@juggernauts.in',
  null, null
),
(
  'e0000006-0000-0000-0000-000000000000',
  'Sambalpur Volleyball Community Cup 2026',
  'Volleyball',
  '2026-05-01',
  'VSS University Ground, Sambalpur',
  'Sambalpur',
  'Senior',
  0.00,
  '2026-04-25',
  48,
  'Community volleyball tournament completed. 8 teams participated from Sambalpur and Bargarh districts. Results available on the Juggernauts portal.',
  'closed',
  'free', 'team', 'auto',
  'Open to all adults 18+. Teams of 12 players maximum.',
  'Sambalpur Volleyball Club Federation',
  'volleyball@juggernauts.in',
  '08:00', '17:00'
),
(
  'e0000007-0000-0000-0000-000000000000',
  'Mayurbhanj Archery Identification Camp 2026',
  'Archery',
  '2026-07-10',
  'Baripada Sports Complex, Baripada',
  'Mayurbhanj',
  'U-15',
  0.00,
  '2026-07-01',
  50,
  'Talent identification camp for archery under the tribal sports development programme. Both recurve and compound disciplines. Selected athletes will receive free equipment and coaching support.',
  'open',
  'free', 'individual', 'manual',
  'Born between 01-Jan-2011 and 31-Dec-2013. Preference given to athletes from ST community in Mayurbhanj district.',
  'Juggernauts Tribal Sports Initiative',
  'archery@juggernauts.in',
  '08:00', '14:00'
),
(
  'e0000008-0000-0000-0000-000000000000',
  'Koraput Kabaddi Youth Cup 2026',
  'Kabaddi',
  '2026-04-10',
  'Koraput Sports Arena, Koraput',
  'Koraput',
  'Senior',
  50.00,
  '2026-04-01',
  40,
  'Annual kabaddi cup completed successfully. 8 teams from Koraput and Malkangiri participated. Champions: Koraput Raider Warriors. Full results on the Juggernauts portal.',
  'completed',
  'paid', 'individual', 'auto',
  'Age 18–35 years. Must be a resident of Koraput or Malkangiri district.',
  'Koraput District Kabaddi Association',
  'kabaddi.koraput@juggernauts.in',
  '09:00', '17:00'
)

on conflict (id) do nothing;

-- ============================================================
-- EVENT REGISTRATIONS — 25 demo registrations
-- ============================================================

insert into public.event_registrations (
  id, event_id, athlete_profile_id, athlete_id,
  registration_status, payment_status,
  amount, currency,
  razorpay_order_id, razorpay_payment_id,
  confirmed_at, registered_at
) values

-- ── Event 1: Odisha U-17 Football Championship (open, paid ₹95) ──────────

-- Rahul Majhi (approved, event_verified) — confirmed + paid
(
  'r0000001-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000001-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000001',
  'confirmed', 'paid',
  95.00, 'INR',
  'order_demo_fb001', 'pay_demo_fb001',
  '2026-03-01 10:30:00+05:30', '2026-03-01 10:00:00+05:30'
),
-- Bikram Soren (approved, community_verified) — confirmed + paid
(
  'r0000002-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000005-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000002',
  'confirmed', 'paid',
  95.00, 'INR',
  'order_demo_fb002', 'pay_demo_fb002',
  '2026-03-03 11:15:00+05:30', '2026-03-03 11:00:00+05:30'
),
-- Binod Sahani (approved, assisted by coach) — confirmed + paid
(
  'r0000003-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000028-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000007',
  'confirmed', 'paid',
  95.00, 'INR',
  'order_demo_fb007', 'pay_demo_fb007',
  '2026-03-05 09:45:00+05:30', '2026-03-05 09:30:00+05:30'
),
-- Dilip Munda (pending profile, community_verified) — pending payment
(
  'r0000004-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000011-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000003',
  'pending', 'pending',
  95.00, 'INR',
  'order_demo_fb003', null,
  null, '2026-03-06 14:00:00+05:30'
),
-- Jayanti Jena (pending profile, assisted by admin) — pending
(
  'r0000005-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000026-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000006',
  'pending', 'pending',
  95.00, 'INR',
  null, null,
  null, '2026-03-07 16:00:00+05:30'
),

-- ── Event 2: Sundargarh Hockey Talent Camp (open, free) ──────────────────

-- Priya Lakra (approved, event_verified) — confirmed, not_required
(
  'r0000006-0000-0000-0000-000000000000',
  'e0000002-0000-0000-0000-000000000000',
  'a0000002-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000001',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-03-02 09:00:00+05:30', '2026-03-02 09:00:00+05:30'
),
-- Deepa Hansdah (approved, community_verified) — confirmed, not_required
(
  'r0000007-0000-0000-0000-000000000000',
  'e0000002-0000-0000-0000-000000000000',
  'a0000006-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000002',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-03-04 10:00:00+05:30', '2026-03-04 10:00:00+05:30'
),
-- Pushpa Kerketta (approved, assisted by volunteer) — confirmed, not_required
(
  'r0000008-0000-0000-0000-000000000000',
  'e0000002-0000-0000-0000-000000000000',
  'a0000029-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000006',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-03-06 08:30:00+05:30', '2026-03-06 08:30:00+05:30'
),
-- Sarita Topno (pending profile) — pending, not_required
(
  'r0000009-0000-0000-0000-000000000000',
  'e0000002-0000-0000-0000-000000000000',
  'a0000017-0000-0000-0000-000000000000', 'JG-OD-HK-2026-000004',
  'pending', 'not_required',
  0.00, 'INR',
  null, null,
  null, '2026-03-08 11:00:00+05:30'
),

-- ── Event 3: Cuttack Athletics Trial (open, free) ─────────────────────────

-- Suresh Nayak (approved) — confirmed, not_required
(
  'r0000010-0000-0000-0000-000000000000',
  'e0000003-0000-0000-0000-000000000000',
  'a0000003-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000001',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-03-01 12:00:00+05:30', '2026-03-01 12:00:00+05:30'
),
-- Kavita Minz (pending, community_verified) — pending, not_required
(
  'r0000011-0000-0000-0000-000000000000',
  'e0000003-0000-0000-0000-000000000000',
  'a0000012-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000002',
  'pending', 'not_required',
  0.00, 'INR',
  null, null,
  null, '2026-03-05 13:00:00+05:30'
),
-- Anita Sahoo (pending, assisted by volunteer) — pending, not_required
(
  'r0000012-0000-0000-0000-000000000000',
  'e0000003-0000-0000-0000-000000000000',
  'a0000022-0000-0000-0000-000000000000', 'JG-OD-AT-2026-000004',
  'pending', 'not_required',
  0.00, 'INR',
  null, null,
  null, '2026-03-07 09:00:00+05:30'
),

-- ── Event 4: Bhubaneswar Badminton Open (open, paid ₹149) ────────────────

-- Anjali Patra (approved, event_verified) — confirmed + paid
(
  'r0000013-0000-0000-0000-000000000000',
  'e0000004-0000-0000-0000-000000000000',
  'a0000004-0000-0000-0000-000000000000', 'JG-OD-BD-2026-000001',
  'confirmed', 'paid',
  149.00, 'INR',
  'order_demo_bd001', 'pay_demo_bd001',
  '2026-03-10 10:00:00+05:30', '2026-03-10 09:45:00+05:30'
),
-- Pranab Giri (pending profile) — pending payment
(
  'r0000014-0000-0000-0000-000000000000',
  'e0000004-0000-0000-0000-000000000000',
  'a0000015-0000-0000-0000-000000000000', 'JG-OD-BD-2026-000002',
  'pending', 'pending',
  149.00, 'INR',
  'order_demo_bd002', null,
  null, '2026-03-12 15:00:00+05:30'
),

-- ── Event 5: Ganjam Cricket Camp (draft, paid ₹199) ──────────────────────

-- Raju Behera (approved) — pending (event is draft, no payment yet)
(
  'r0000015-0000-0000-0000-000000000000',
  'e0000005-0000-0000-0000-000000000000',
  'a0000007-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000001',
  'pending', 'pending',
  199.00, 'INR',
  null, null,
  null, '2026-03-15 10:00:00+05:30'
),
-- Rakesh Mandal (approved, assisted by admin) — pending
(
  'r0000016-0000-0000-0000-000000000000',
  'e0000005-0000-0000-0000-000000000000',
  'a0000033-0000-0000-0000-000000000000', 'JG-OD-CK-2026-000004',
  'pending', 'pending',
  199.00, 'INR',
  null, null,
  null, '2026-03-16 11:30:00+05:30'
),

-- ── Event 6: Sambalpur Volleyball Cup (closed, free) ─────────────────────

-- Sunita Pradhan (approved) — confirmed, not_required [event closed]
(
  'r0000017-0000-0000-0000-000000000000',
  'e0000006-0000-0000-0000-000000000000',
  'a0000008-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000001',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-04-10 09:00:00+05:30', '2026-04-10 09:00:00+05:30'
),
-- Soumya Pradhan (approved, assisted by captain) — confirmed, not_required
(
  'r0000018-0000-0000-0000-000000000000',
  'e0000006-0000-0000-0000-000000000000',
  'a0000034-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000003',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-04-12 10:00:00+05:30', '2026-04-12 10:00:00+05:30'
),
-- Kumar Biswal (pending, assisted by coach) — cancelled [withdrew]
(
  'r0000019-0000-0000-0000-000000000000',
  'e0000006-0000-0000-0000-000000000000',
  'a0000023-0000-0000-0000-000000000000', 'JG-OD-VB-2026-000002',
  'cancelled', 'not_required',
  0.00, 'INR',
  null, null,
  null, '2026-04-15 14:00:00+05:30'
),

-- ── Event 7: Mayurbhanj Archery Camp (open, free) ────────────────────────

-- Laxmi Murmu (approved, event_verified) — confirmed, not_required
(
  'r0000020-0000-0000-0000-000000000000',
  'e0000007-0000-0000-0000-000000000000',
  'a0000010-0000-0000-0000-000000000000', 'JG-OD-AR-2026-000001',
  'confirmed', 'not_required',
  0.00, 'INR',
  null, null,
  '2026-03-20 09:00:00+05:30', '2026-03-20 09:00:00+05:30'
),
-- Reena Panda (pending, assisted by captain) — pending, not_required
(
  'r0000021-0000-0000-0000-000000000000',
  'e0000007-0000-0000-0000-000000000000',
  'a0000024-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000002',
  'pending', 'not_required',
  0.00, 'INR',
  null, null,
  null, '2026-03-22 10:00:00+05:30'
),

-- ── Event 8: Koraput Kabaddi Cup (completed, paid ₹50) ───────────────────

-- Manoj Tudu (approved, event_verified) — confirmed + paid [attended]
(
  'r0000022-0000-0000-0000-000000000000',
  'e0000008-0000-0000-0000-000000000000',
  'a0000009-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000001',
  'confirmed', 'paid',
  50.00, 'INR',
  'order_demo_kb001', 'pay_demo_kb001',
  '2026-03-25 08:30:00+05:30', '2026-03-25 08:00:00+05:30'
),
-- Hemant Nag (approved, assisted by volunteer) — confirmed + paid
(
  'r0000023-0000-0000-0000-000000000000',
  'e0000008-0000-0000-0000-000000000000',
  'a0000035-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000003',
  'confirmed', 'paid',
  50.00, 'INR',
  'order_demo_kb003', 'pay_demo_kb003',
  '2026-03-26 09:00:00+05:30', '2026-03-26 08:30:00+05:30'
),
-- Reena Panda (pending, in kabaddi) — confirmed + paid [different event from archery reg]
(
  'r0000024-0000-0000-0000-000000000000',
  'e0000008-0000-0000-0000-000000000000',
  'a0000024-0000-0000-0000-000000000000', 'JG-OD-KB-2026-000002',
  'confirmed', 'paid',
  50.00, 'INR',
  'order_demo_kb002', 'pay_demo_kb002',
  '2026-03-27 10:00:00+05:30', '2026-03-27 09:30:00+05:30'
),
-- Biren Naik (pending profile, football) — failed payment
(
  'r0000025-0000-0000-0000-000000000000',
  'e0000001-0000-0000-0000-000000000000',
  'a0000016-0000-0000-0000-000000000000', 'JG-OD-FB-2026-000004',
  'failed', 'failed',
  95.00, 'INR',
  'order_demo_fb004', null,
  null, '2026-03-08 15:00:00+05:30'
)

on conflict (event_id, athlete_profile_id) do nothing;

-- ============================================================
-- Mark attendance for completed event (Kabaddi Cup)
-- ============================================================
update public.event_registrations
  set attendance_marked = true
  where event_id = 'e0000008-0000-0000-0000-000000000000'
    and registration_status = 'confirmed';

-- ============================================================
-- Summary
-- ============================================================
-- Athletes seeded:     35
--   Approved+Public:  15  (JG-OD-FB/HK/AT/BD/CK/VB/KB/AR-2026-*)
--   Pending:          17  (includes 6 assisted, 2 verified-but-not-approved)
--   Rejected:          2  (with rejection reasons)
--   Inactive:          1
--
-- Events seeded:        8
--   Open (paid):        2  (Football ₹95, Badminton ₹149)
--   Open (free):        3  (Hockey, Athletics, Archery)
--   Draft (paid):       1  (Cricket ₹199)
--   Closed (free):      1  (Volleyball)
--   Completed (paid):   1  (Kabaddi ₹50)
--
-- Registrations seeded: 25
--   confirmed+paid:     7
--   confirmed+free:     8
--   pending:            7
--   cancelled:          1
--   failed:             1
--   attendance marked:  2 (Kabaddi completed event)
-- ============================================================
