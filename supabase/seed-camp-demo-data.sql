-- ============================================================
-- JSF Camp Verified — Demo Seed Data
-- Run in Supabase SQL Editor AFTER migration 010_camp_verified.sql
-- Idempotent: safe to re-run
-- ============================================================

-- CLEANUP previous seed data
delete from public.athlete_camp_scores where camp_id in (
  'c0000001-0000-0000-0000-000000000000',
  'c0000002-0000-0000-0000-000000000000'
);
delete from public.coach_assessments where camp_id in (
  'c0000001-0000-0000-0000-000000000000',
  'c0000002-0000-0000-0000-000000000000'
);
delete from public.test_results where camp_id in (
  'c0000001-0000-0000-0000-000000000000',
  'c0000002-0000-0000-0000-000000000000'
);
delete from public.camp_participants where camp_id in (
  'c0000001-0000-0000-0000-000000000000',
  'c0000002-0000-0000-0000-000000000000'
);
delete from public.camps where id in (
  'c0000001-0000-0000-0000-000000000000',
  'c0000002-0000-0000-0000-000000000000'
);

-- ============================================================
-- CAMPS
-- ============================================================
insert into public.camps (id, name, sport, district, venue, camp_date, start_time, end_time, age_groups, status, description)
values
  ('c0000001-0000-0000-0000-000000000000',
   'Bhubaneswar Football Camp 2026', 'Football', 'Khordha',
   'Kalinga Stadium Practice Ground', '2026-03-15', '08:00', '17:00',
   ARRAY['U-15','U-17'], 'completed',
   'First JSF grassroots football assessment camp. U-15 and U-17 athletes from Khordha district.'),

  ('c0000002-0000-0000-0000-000000000000',
   'Cuttack Grassroots Football Assessment 2026', 'Football', 'Cuttack',
   'Barabati Practice Ground', '2026-04-20', '08:30', '16:30',
   ARRAY['U-13','U-15'], 'completed',
   'Second JSF camp focusing on younger age groups. U-13 and U-15 athletes from Cuttack district.');

-- ============================================================
-- CAMP PARTICIPANTS — Camp 1 (Bhubaneswar, U-15/U-17)
-- Uses athlete UUIDs from seed-demo-data.sql
-- a0000001 = JG-OD-FB-2026-000001 (Football, U-17 assumed from seed)
-- ============================================================
insert into public.camp_participants
  (id, camp_id, athlete_id, athlete_code, attendance_status, consent_verified, camp_verification_status, public_summary_enabled)
values
  ('cp000001-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','JG-OD-FB-2026-000001','attended',true,'camp_verified',true),
  ('cp000002-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','JG-OD-FB-2026-000002','attended',true,'camp_verified',true),
  ('cp000003-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','JG-OD-FB-2026-000003','attended',true,'camp_verified',true),
  ('cp000004-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','JG-OD-FB-2026-000004','attended',true,'camp_verified',false),
  ('cp000005-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000022-0000-0000-0000-000000000000','JG-OD-FB-2026-000005','attended',true,'in_progress',false),
  ('cp000006-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000023-0000-0000-0000-000000000000','JG-OD-FB-2026-000006','absent',false,'not_started',false),
  ('cp000007-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','JG-OD-FB-2026-000007','attended',true,'camp_verified',true),
  ('cp000008-0000-0000-0000-000000000000','c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','JG-OD-FB-2026-000008','attended',true,'camp_verified',false)
on conflict (camp_id, athlete_id) do nothing;

-- Camp 2 participants (Cuttack, U-13/U-15)
insert into public.camp_participants
  (id, camp_id, athlete_id, athlete_code, attendance_status, consent_verified, camp_verification_status, public_summary_enabled)
values
  ('cp000009-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','JG-OD-HK-2026-000001','attended',true,'camp_verified',true),
  ('cp000010-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','JG-OD-HK-2026-000002','attended',true,'camp_verified',true),
  ('cp000011-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000013-0000-0000-0000-000000000000','JG-OD-HK-2026-000003','attended',true,'camp_verified',false),
  ('cp000012-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','JG-OD-FB-2026-000033','attended',true,'camp_verified',true),
  ('cp000013-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000034-0000-0000-0000-000000000000','JG-OD-FB-2026-000034','attended',true,'camp_verified',false),
  ('cp000014-0000-0000-0000-000000000000','c0000002-0000-0000-0000-000000000000','a0000035-0000-0000-0000-000000000000','JG-OD-FB-2026-000035','registered',false,'not_started',false)
on conflict (camp_id, athlete_id) do nothing;

-- ============================================================
-- TEST RESULTS — Camp 1 athletes
-- Test UUIDs: sprint=td000001, agility=td000002, yoyo=td000003
--             dribble=td000004, passing=td000005, shooting=td000006
-- ============================================================
insert into public.test_results
  (camp_id, athlete_id, test_definition_id, attempt_1, attempt_2, best_value, raw_value, unit)
values
  -- Athlete 1 (strong performer)
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.2,4.1,4.1,4.1,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',4.8,4.7,4.7,4.7,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',14.5,null,14.5,14.5,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',8.2,7.9,7.9,7.9,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',8.0,null,8.0,8.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',7.0,null,7.0,7.0,'out of 10'),
  -- Athlete 2 (good performer)
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.5,4.4,4.4,4.4,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',5.1,5.0,5.0,5.0,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',12.5,null,12.5,12.5,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',9.0,8.8,8.8,8.8,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',7.0,null,7.0,7.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',6.0,null,6.0,6.0,'out of 10'),
  -- Athlete 3 (average)
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',5.0,4.9,4.9,4.9,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',5.5,5.4,5.4,5.4,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',10.0,null,10.0,10.0,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',10.5,10.2,10.2,10.2,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',5.0,null,5.0,5.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',4.0,null,4.0,4.0,'out of 10'),
  -- Athlete 4 (below average)
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',5.5,5.4,5.4,5.4,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',6.0,5.9,5.9,5.9,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',8.0,null,8.0,8.0,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',12.0,11.8,11.8,11.8,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',4.0,null,4.0,4.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',3.0,null,3.0,3.0,'out of 10'),
  -- Athlete 7 (strong)
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.0,3.9,3.9,3.9,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',4.6,4.5,4.5,4.5,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',15.0,null,15.0,15.0,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',7.5,7.3,7.3,7.3,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',9.0,null,9.0,9.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',8.0,null,8.0,8.0,'out of 10'),
  -- Athlete 8 (good)
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.6,4.5,4.5,4.5,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',5.2,5.1,5.1,5.1,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',11.5,null,11.5,11.5,'level'),
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',9.5,9.2,9.2,9.2,'seconds'),
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',6.0,null,6.0,6.0,'out of 10'),
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',5.0,null,5.0,5.0,'out of 10')
on conflict do nothing;

-- Camp 2 test results
insert into public.test_results
  (camp_id, athlete_id, test_definition_id, attempt_1, attempt_2, best_value, raw_value, unit)
values
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.7,4.6,4.6,4.6,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',5.3,5.2,5.2,5.2,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',11.0,null,11.0,11.0,'level'),
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',9.8,9.5,9.5,9.5,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',6.0,null,6.0,6.0,'out of 10'),
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',5.0,null,5.0,5.0,'out of 10'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.3,4.2,4.2,4.2,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',4.9,4.8,4.8,4.8,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',13.5,null,13.5,13.5,'level'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',8.5,8.2,8.2,8.2,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',7.0,null,7.0,7.0,'out of 10'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',7.0,null,7.0,7.0,'out of 10'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000001-0000-0000-0000-000000000000',4.8,4.7,4.7,4.7,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000002-0000-0000-0000-000000000000',5.4,5.3,5.3,5.3,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000003-0000-0000-0000-000000000000',9.5,null,9.5,9.5,'level'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000004-0000-0000-0000-000000000000',11.0,10.8,10.8,10.8,'seconds'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000005-0000-0000-0000-000000000000',5.0,null,5.0,5.0,'out of 10'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','td000006-0000-0000-0000-000000000000',4.0,null,4.0,4.0,'out of 10')
on conflict do nothing;

-- ============================================================
-- COACH ASSESSMENTS — Camp 1
-- ============================================================
insert into public.coach_assessments
  (camp_id, athlete_id, sport,
   first_touch_score, decision_making_score, off_ball_movement_score,
   defensive_effort_score, communication_score, teamwork_score,
   coachability_score, attitude_score, overall_game_score,
   potential_flag, public_summary)
values
  -- Athlete 1: excellent all-round
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000','Football',
   5,5,4,4,4,4,5,5,5,true,
   'Outstanding technical ability with excellent coachability. Strong candidate for further evaluation.'),
  -- Athlete 2: good
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000','Football',
   4,4,3,4,3,4,4,4,4,false,
   'Good all-round performance with solid technical base. Showed good game understanding.'),
  -- Athlete 3: average
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000','Football',
   3,3,3,3,3,3,4,4,3,false,
   'Showed consistent effort throughout the camp. Good attitude and willingness to learn.'),
  -- Athlete 4: needs development
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000','Football',
   2,2,2,3,3,3,3,4,2,false,
   'Participated fully in camp activities. Technical skills need further development.'),
  -- Athlete 7: excellent
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000','Football',
   5,4,5,4,4,5,5,5,5,true,
   'Exceptional movement quality and first touch. Natural leader on the pitch.'),
  -- Athlete 8: good
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000','Football',
   4,3,4,3,3,4,4,4,4,false,
   'Good technical foundation and positive attitude. Consistent performer throughout the day.')
on conflict (camp_id, athlete_id) do nothing;

-- Camp 2 coach assessments
insert into public.coach_assessments
  (camp_id, athlete_id, sport,
   first_touch_score, decision_making_score, off_ball_movement_score,
   defensive_effort_score, communication_score, teamwork_score,
   coachability_score, attitude_score, overall_game_score,
   potential_flag, public_summary)
values
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000','Football',
   3,3,3,3,3,3,4,4,3,false,
   'Steady camp performance. Showed good effort in drills and positive team spirit.'),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000','Football',
   4,4,4,3,4,4,5,5,4,true,
   'Very strong for age group. High potential flag — excellent coachability and attitude.'),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000','Football',
   3,2,3,3,3,3,4,4,3,false,
   'Good participation and effort throughout the camp.')
on conflict (camp_id, athlete_id) do nothing;

-- ============================================================
-- PRE-CALCULATED SCORES — Camp 1
-- These reflect reasonable manual calculations for demo purposes.
-- Real scores would be calculated via the /api/camps/calculate endpoint.
-- ============================================================
insert into public.athlete_camp_scores
  (camp_id, athlete_id,
   athletic_base_score, sport_skill_score, game_score,
   development_potential_score, data_confidence_score,
   final_score_100, rating_10,
   recommendation_category, confidence_label, small_cohort_warning,
   calculated_at)
values
  -- Athlete 1: JSF Recommended
  ('c0000001-0000-0000-0000-000000000000','a0000001-0000-0000-0000-000000000000',
   21.5,30.8,23.1,9.8,4.5,89.7,9.0,'JSF Recommended','high',false,now()),
  -- Athlete 2: JSF Watchlist
  ('c0000001-0000-0000-0000-000000000000','a0000005-0000-0000-0000-000000000000',
   18.2,25.5,20.8,8.5,4.5,77.5,7.8,'JSF Watchlist','high',false,now()),
  -- Athlete 3: Development Track
  ('c0000001-0000-0000-0000-000000000000','a0000011-0000-0000-0000-000000000000',
   13.5,17.0,16.7,8.0,4.0,59.2,5.9,'Development Track','medium',false,now()),
  -- Athlete 4: Participation Track
  ('c0000001-0000-0000-0000-000000000000','a0000016-0000-0000-0000-000000000000',
   10.2,11.3,12.5,7.5,4.0,45.5,4.6,'Participation Track','medium',false,now()),
  -- Athlete 7: JSF Recommended
  ('c0000001-0000-0000-0000-000000000000','a0000028-0000-0000-0000-000000000000',
   23.0,32.5,24.2,9.8,4.5,94.0,9.4,'JSF Recommended','high',false,now()),
  -- Athlete 8: JSF Watchlist
  ('c0000001-0000-0000-0000-000000000000','a0000029-0000-0000-0000-000000000000',
   17.5,22.0,20.8,8.5,4.5,73.3,7.3,'JSF Watchlist','high',false,now())
on conflict (camp_id, athlete_id) do nothing;

-- Camp 2 scores (smaller cohort — mark small_cohort_warning)
insert into public.athlete_camp_scores
  (camp_id, athlete_id,
   athletic_base_score, sport_skill_score, game_score,
   development_potential_score, data_confidence_score,
   final_score_100, rating_10,
   recommendation_category, confidence_label, small_cohort_warning,
   calculated_at)
values
  ('c0000002-0000-0000-0000-000000000000','a0000002-0000-0000-0000-000000000000',
   14.0,18.5,16.7,8.0,4.0,61.2,6.1,'Development Track','medium',true,now()),
  ('c0000002-0000-0000-0000-000000000000','a0000006-0000-0000-0000-000000000000',
   19.5,27.0,21.7,9.8,4.0,82.0,8.2,'JSF Recommended','medium',true,now()),
  ('c0000002-0000-0000-0000-000000000000','a0000033-0000-0000-0000-000000000000',
   14.8,16.5,16.7,8.0,4.0,60.0,6.0,'Development Track','medium',true,now())
on conflict (camp_id, athlete_id) do nothing;

-- Update camp_participants with final ratings from scores
update public.camp_participants cp
set
  final_rating      = acs.rating_10,
  final_score_100   = acs.final_score_100,
  recommendation_category = acs.recommendation_category,
  data_confidence_score   = acs.data_confidence_score
from public.athlete_camp_scores acs
where cp.camp_id    = acs.camp_id
  and cp.athlete_id = acs.athlete_id;

-- Update athletes.latest_camp_* for scored athletes
update public.athletes a
set
  latest_camp_verified_at = now(),
  latest_camp_rating = acs.rating_10,
  latest_recommendation_category = acs.recommendation_category
from public.athlete_camp_scores acs
where a.id = acs.athlete_id;

-- ============================================================
-- Summary
-- ============================================================
-- Camps seeded: 2
--   Camp 1 (Bhubaneswar, completed): 8 participants, 6 scored
--     JSF Recommended: 2 (a0000001, a0000028)
--     JSF Watchlist:   2 (a0000005, a0000029)
--     Development Track: 1 (a0000011)
--     Participation Track: 1 (a0000016)
--     Not started/absent: 2
--   Camp 2 (Cuttack, completed): 6 participants, 3 scored
--     JSF Recommended: 1 (a0000006) — with small cohort warning
--     Development Track: 2 (a0000002, a0000033) — with small cohort warning
--     Not started: 1 (a0000035)
-- ============================================================
