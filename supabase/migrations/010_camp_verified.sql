-- ============================================================
-- 010 — JSF Camp Verified Module 1
-- Football assessment camps, test results, coach assessments,
-- scoring, and recommendation categories.
-- ============================================================

-- ============================================================
-- ATHLETES TABLE — add camp-related summary columns
-- ============================================================
alter table public.athletes
  add column if not exists latest_camp_verified_at timestamptz,
  add column if not exists latest_camp_rating     numeric(4,2),
  add column if not exists latest_recommendation_category text;

-- ============================================================
-- CAMPS
-- ============================================================
create table if not exists public.camps (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  sport          text not null default 'Football',
  district       text not null,
  venue          text not null,
  camp_date      date not null,
  start_time     time,
  end_time       time,
  age_groups     text[] not null default '{}',
  organiser_name text not null default 'Juggernauts Sporting Foundation',
  status         text not null default 'draft'
    check (status in ('draft', 'open', 'completed', 'cancelled')),
  description    text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists camps_status_idx    on public.camps(status);
create index if not exists camps_district_idx  on public.camps(district);
create index if not exists camps_camp_date_idx on public.camps(camp_date);

-- ============================================================
-- CAMP PARTICIPANTS
-- ============================================================
create table if not exists public.camp_participants (
  id                        uuid default gen_random_uuid() primary key,
  camp_id                   uuid not null references public.camps(id) on delete cascade,
  athlete_id                uuid not null references public.athletes(id) on delete cascade,
  athlete_code              text,
  attendance_status         text not null default 'registered'
    check (attendance_status in ('registered', 'attended', 'absent', 'withdrawn')),
  consent_verified          boolean not null default false,
  camp_verification_status  text not null default 'not_started'
    check (camp_verification_status in ('not_started', 'in_progress', 'camp_verified', 'not_verified')),
  final_rating              numeric(4,2),
  final_score_100           numeric(6,2),
  recommendation_category   text
    check (
      recommendation_category in ('JSF Recommended','JSF Watchlist','Development Track','Participation Track')
      or recommendation_category is null
    ),
  data_confidence_score     numeric(4,2),
  public_summary_enabled    boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (camp_id, athlete_id)
);

create index if not exists camp_participants_camp_idx    on public.camp_participants(camp_id);
create index if not exists camp_participants_athlete_idx on public.camp_participants(athlete_id);

-- ============================================================
-- TEST DEFINITIONS
-- ============================================================
create table if not exists public.test_definitions (
  id                       uuid default gen_random_uuid() primary key,
  sport                    text not null,
  test_name                text not null,
  test_category            text not null
    check (test_category in (
      'athletic_base','technical_skill','game_assessment',
      'development_potential','data_confidence'
    )),
  unit                     text not null,
  lower_is_better          boolean not null default false,
  age_group_applicability  text[],
  gender_applicability     text[],
  protocol_text            text,
  equipment_needed         text,
  scoring_weight           numeric(4,2) not null default 1.0,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now()
);

create index if not exists test_definitions_sport_idx on public.test_definitions(sport);

-- ============================================================
-- TEST RESULTS
-- ============================================================
create table if not exists public.test_results (
  id                 uuid default gen_random_uuid() primary key,
  camp_id            uuid not null references public.camps(id) on delete cascade,
  athlete_id         uuid not null references public.athletes(id) on delete cascade,
  test_definition_id uuid not null references public.test_definitions(id) on delete restrict,
  raw_value          numeric,
  unit               text,
  attempt_1          numeric,
  attempt_2          numeric,
  attempt_3          numeric,
  best_value         numeric,
  percentile_score   numeric(5,2),
  score_out_of_10    numeric(4,2),
  recorded_by        uuid references public.profiles(id) on delete set null,
  verified_by        uuid references public.profiles(id) on delete set null,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists test_results_camp_athlete_idx on public.test_results(camp_id, athlete_id);

-- ============================================================
-- COACH ASSESSMENTS
-- ============================================================
create table if not exists public.coach_assessments (
  id                       uuid default gen_random_uuid() primary key,
  camp_id                  uuid not null references public.camps(id) on delete cascade,
  athlete_id               uuid not null references public.athletes(id) on delete cascade,
  sport                    text not null default 'Football',
  first_touch_score        int check (first_touch_score        between 1 and 5),
  decision_making_score    int check (decision_making_score    between 1 and 5),
  off_ball_movement_score  int check (off_ball_movement_score  between 1 and 5),
  defensive_effort_score   int check (defensive_effort_score   between 1 and 5),
  communication_score      int check (communication_score      between 1 and 5),
  teamwork_score           int check (teamwork_score           between 1 and 5),
  coachability_score       int check (coachability_score       between 1 and 5),
  attitude_score           int check (attitude_score           between 1 and 5),
  overall_game_score       int check (overall_game_score       between 1 and 5),
  potential_flag           boolean not null default false,
  private_notes            text,
  public_summary           text,
  assessed_by              uuid references public.profiles(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (camp_id, athlete_id)
);

create index if not exists coach_assessments_camp_athlete_idx on public.coach_assessments(camp_id, athlete_id);

-- ============================================================
-- ATHLETE CAMP SCORES
-- ============================================================
create table if not exists public.athlete_camp_scores (
  id                          uuid default gen_random_uuid() primary key,
  camp_id                     uuid not null references public.camps(id) on delete cascade,
  athlete_id                  uuid not null references public.athletes(id) on delete cascade,
  athletic_base_score         numeric(6,2),
  sport_skill_score           numeric(6,2),
  game_score                  numeric(6,2),
  development_potential_score numeric(6,2),
  data_confidence_score       numeric(6,2),
  final_score_100             numeric(6,2),
  rating_10                   numeric(4,2),
  recommendation_category     text,
  confidence_label            text check (confidence_label in ('low','medium','high','verified_high')),
  small_cohort_warning        boolean not null default false,
  calculated_at               timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (camp_id, athlete_id)
);

create index if not exists athlete_camp_scores_camp_idx on public.athlete_camp_scores(camp_id);

-- ============================================================
-- TRIGGERS (updated_at) — reuse existing set_updated_at function
-- ============================================================
create trigger camps_updated_at
  before update on public.camps
  for each row execute function public.set_updated_at();

create trigger camp_participants_updated_at
  before update on public.camp_participants
  for each row execute function public.set_updated_at();

create trigger test_results_updated_at
  before update on public.test_results
  for each row execute function public.set_updated_at();

create trigger coach_assessments_updated_at
  before update on public.coach_assessments
  for each row execute function public.set_updated_at();

create trigger athlete_camp_scores_updated_at
  before update on public.athlete_camp_scores
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.camps                enable row level security;
alter table public.camp_participants    enable row level security;
alter table public.test_definitions     enable row level security;
alter table public.test_results         enable row level security;
alter table public.coach_assessments    enable row level security;
alter table public.athlete_camp_scores  enable row level security;

-- test_definitions: public read active; admin write
create policy "test_definitions: public read"
  on public.test_definitions for select using (is_active = true);
create policy "test_definitions: admin write"
  on public.test_definitions for all using (public.get_my_role() = 'admin');

-- camps: admin all; volunteer read
create policy "camps: admin all"
  on public.camps for all using (public.get_my_role() = 'admin');
create policy "camps: volunteer read"
  on public.camps for select using (public.get_my_role() in ('volunteer','admin'));

-- camp_participants: admin all; volunteer read
create policy "camp_participants: admin all"
  on public.camp_participants for all using (public.get_my_role() = 'admin');
create policy "camp_participants: volunteer read"
  on public.camp_participants for select using (public.get_my_role() in ('volunteer','admin'));

-- test_results: admin all; volunteer read
create policy "test_results: admin all"
  on public.test_results for all using (public.get_my_role() = 'admin');
create policy "test_results: volunteer read"
  on public.test_results for select using (public.get_my_role() in ('volunteer','admin'));

-- coach_assessments: admin all; volunteer read (private_notes filtered at app layer)
create policy "coach_assessments: admin all"
  on public.coach_assessments for all using (public.get_my_role() = 'admin');
create policy "coach_assessments: volunteer read"
  on public.coach_assessments for select using (public.get_my_role() in ('volunteer','admin'));

-- athlete_camp_scores: admin all; public can read (app filters by public_summary_enabled)
create policy "athlete_camp_scores: admin all"
  on public.athlete_camp_scores for all using (public.get_my_role() = 'admin');
create policy "athlete_camp_scores: public read"
  on public.athlete_camp_scores for select using (true);

-- ============================================================
-- SEED FOOTBALL TEST DEFINITIONS
-- ============================================================
insert into public.test_definitions
  (id, sport, test_name, test_category, unit, lower_is_better, protocol_text, equipment_needed, scoring_weight)
values
  ('00000001-0000-0000-0000-000000000000','Football','30m Sprint',
   'athletic_base','seconds',true,
   'Athlete starts from standing position. Timer starts on first movement. Best of two attempts recorded.',
   'Measuring tape, cones, stopwatch or timing gates',1.0),

  ('00000002-0000-0000-0000-000000000000','Football','5-10-5 Agility Test',
   'athletic_base','seconds',true,
   'Athlete starts at centre cone. Sprints 5m right, back 10m left, back 5m to centre. Best of two attempts.',
   'Cones, stopwatch or timing gates',1.0),

  ('00000003-0000-0000-0000-000000000000','Football','Yo-Yo / Beep Test',
   'athletic_base','level',false,
   'Standard beep test. Record final level reached. Athlete runs back and forth at increasing pace.',
   'Cones, audio player, beep test audio file',1.0),

  ('00000004-0000-0000-0000-000000000000','Football','Dribble Slalom',
   'technical_skill','seconds',true,
   'Athlete dribbles through 10 cones set 1.5m apart. Timed from first touch to last cone. Best of two attempts.',
   'Football, 10 cones, stopwatch',1.0),

  ('00000005-0000-0000-0000-000000000000','Football','Passing Accuracy',
   'technical_skill','out of 10',false,
   'Athlete makes 10 passes to a target zone from 15m. Count successful passes that hit target.',
   'Football, target markers, measuring tape',1.0),

  ('00000006-0000-0000-0000-000000000000','Football','Shooting Accuracy',
   'technical_skill','out of 10',false,
   'Athlete takes 10 shots from 12m targeting marked goal zones. Count shots on target in correct zone.',
   'Football, goal with zone markings, measuring tape',1.0)
on conflict (id) do nothing;
