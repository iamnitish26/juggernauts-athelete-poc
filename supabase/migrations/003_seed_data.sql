-- ============================================================
-- Seed Data: Sports and Odisha Districts
-- ============================================================

-- Sports
insert into public.sports (name, code) values
  ('Football', 'FB'),
  ('Hockey', 'HK'),
  ('Athletics', 'AT'),
  ('Cricket', 'CK'),
  ('Badminton', 'BD'),
  ('Basketball', 'BK'),
  ('Volleyball', 'VB'),
  ('Kabaddi', 'KB'),
  ('Wrestling', 'WR'),
  ('Boxing', 'BX'),
  ('Swimming', 'SW'),
  ('Table Tennis', 'TT'),
  ('Tennis', 'TN'),
  ('Archery', 'AR'),
  ('Other', 'OT')
on conflict (name) do nothing;

-- Odisha Districts
insert into public.districts (name, state) values
  ('Angul', 'Odisha'),
  ('Balangir', 'Odisha'),
  ('Balasore', 'Odisha'),
  ('Bargarh', 'Odisha'),
  ('Bhadrak', 'Odisha'),
  ('Boudh', 'Odisha'),
  ('Cuttack', 'Odisha'),
  ('Deogarh', 'Odisha'),
  ('Dhenkanal', 'Odisha'),
  ('Gajapati', 'Odisha'),
  ('Ganjam', 'Odisha'),
  ('Jagatsinghpur', 'Odisha'),
  ('Jajpur', 'Odisha'),
  ('Jharsuguda', 'Odisha'),
  ('Kalahandi', 'Odisha'),
  ('Kandhamal', 'Odisha'),
  ('Kendrapara', 'Odisha'),
  ('Kendujhar', 'Odisha'),
  ('Khordha', 'Odisha'),
  ('Koraput', 'Odisha'),
  ('Malkangiri', 'Odisha'),
  ('Mayurbhanj', 'Odisha'),
  ('Nabarangpur', 'Odisha'),
  ('Nayagarh', 'Odisha'),
  ('Nuapada', 'Odisha'),
  ('Puri', 'Odisha'),
  ('Rayagada', 'Odisha'),
  ('Sambalpur', 'Odisha'),
  ('Subarnapur', 'Odisha'),
  ('Sundergarh', 'Odisha')
on conflict (name, state) do nothing;

-- Example test athlete (seed only; requires a real auth user to reference)
-- Uncomment and replace user_id with a real UUID after creating a test user:
/*
insert into public.athletes (
  user_id, athlete_id, full_name, gender, date_of_birth, age_group,
  state, district, city_block, primary_sport, position_event_category,
  current_club_school, years_of_experience, achievement_summary,
  data_consent, photo_consent, verification_status
) values (
  null,
  'JG-OD-FB-2026-000001',
  'Arjun Pradhan',
  'male',
  '2009-03-15',
  'U-17',
  'Odisha',
  'Cuttack',
  'Cuttack City',
  'Football',
  'Forward',
  'Cuttack FC Academy',
  5,
  'District level gold medalist 2024, State U-17 camp participant',
  true,
  true,
  'community_verified'
);
*/
