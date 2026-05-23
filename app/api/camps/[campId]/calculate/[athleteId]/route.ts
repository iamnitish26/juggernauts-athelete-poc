import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculatePercentileScore,
  calculateTestScoreOutOf10,
  calculateFootballCampScore,
} from "@/lib/scoring/footballCampScoring";

const TEST_IDS = {
  sprint:   "00000001-0000-0000-0000-000000000000",
  agility:  "00000002-0000-0000-0000-000000000000",
  yoyo:     "00000003-0000-0000-0000-000000000000",
  dribble:  "00000004-0000-0000-0000-000000000000",
  passing:  "00000005-0000-0000-0000-000000000000",
  shooting: "00000006-0000-0000-0000-000000000000",
} as const;

const LOWER_IS_BETTER = new Set([TEST_IDS.sprint, TEST_IDS.agility, TEST_IDS.dribble]);

interface RouteParams {
  params: Promise<{ campId: string; athleteId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { campId, athleteId } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  // Load this athlete's participant record
  const { data: participant } = await supabase
    .from("camp_participants")
    .select("id, attendance_status")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId)
    .single();

  if (!participant) {
    return NextResponse.json({ error: "Athlete not found in this camp." }, { status: 404 });
  }

  // Load athlete details (for cohort matching and age-group weighting)
  const { data: athlete } = await supabase
    .from("athletes")
    .select("age_group, gender")
    .eq("id", athleteId)
    .single();

  if (!athlete) return NextResponse.json({ error: "Athlete not found." }, { status: 404 });

  // Load this athlete's test results
  const { data: myResults } = await supabase
    .from("test_results")
    .select("test_definition_id, best_value")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId);

  // Build cohort: all participants in this camp with same age_group and gender
  const { data: cohortParticipants } = await supabase
    .from("camp_participants")
    .select("athlete_id")
    .eq("camp_id", campId);

  const cohortAthleteIds = (cohortParticipants ?? []).map((p) => p.athlete_id);

  // Load cohort athletes filtered by age_group + gender
  let cohortIds: string[] = [];
  if (cohortAthleteIds.length > 0) {
    const { data: cohortAthletes } = await supabase
      .from("athletes")
      .select("id")
      .in("id", cohortAthleteIds)
      .eq("age_group", athlete.age_group)
      .eq("gender", athlete.gender);
    cohortIds = (cohortAthletes ?? []).map((a) => a.id);
  }

  const cohortSize = cohortIds.length;

  // Load all cohort test results for each test
  const cohortResults: Record<string, number[]> = {};
  if (cohortIds.length > 0) {
    const { data: allCohortResults } = await supabase
      .from("test_results")
      .select("test_definition_id, best_value, athlete_id")
      .eq("camp_id", campId)
      .in("athlete_id", cohortIds)
      .not("best_value", "is", null);

    for (const r of allCohortResults ?? []) {
      if (!cohortResults[r.test_definition_id]) cohortResults[r.test_definition_id] = [];
      if (r.best_value != null) cohortResults[r.test_definition_id].push(r.best_value);
    }
  }

  // Calculate percentile scores and update test_results rows
  const myResultMap: Record<string, { id?: string; best_value: number }> = {};
  for (const r of myResults ?? []) {
    if (r.best_value != null) {
      myResultMap[r.test_definition_id] = { best_value: r.best_value };
    }
  }

  // Load test result IDs for updating
  const { data: myResultRows } = await supabase
    .from("test_results")
    .select("id, test_definition_id, best_value")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId);

  const testScores: {
    sprint?: number | null;
    agility?: number | null;
    yoyo?: number | null;
    dribble?: number | null;
    passing?: number | null;
    shooting?: number | null;
  } = {};

  for (const row of myResultRows ?? []) {
    if (row.best_value == null) continue;
    const defId = row.test_definition_id;
    const cohortVals = cohortResults[defId] ?? [row.best_value];
    const lowerIsBetter = (LOWER_IS_BETTER as Set<string>).has(defId);
    const percentile = calculatePercentileScore(row.best_value, cohortVals, lowerIsBetter);
    const score10 = calculateTestScoreOutOf10(percentile);

    // Update the test_results row with calculated scores
    await supabase
      .from("test_results")
      .update({ percentile_score: percentile, score_out_of_10: score10 })
      .eq("id", row.id);

    // Map to named slots
    if (defId === TEST_IDS.sprint) testScores.sprint = score10;
    else if (defId === TEST_IDS.agility) testScores.agility = score10;
    else if (defId === TEST_IDS.yoyo) testScores.yoyo = score10;
    else if (defId === TEST_IDS.dribble) testScores.dribble = score10;
    else if (defId === TEST_IDS.passing) testScores.passing = score10;
    else if (defId === TEST_IDS.shooting) testScores.shooting = score10;
  }

  // Load coach assessment
  const { data: coach } = await supabase
    .from("coach_assessments")
    .select("first_touch_score, decision_making_score, off_ball_movement_score, defensive_effort_score, communication_score, teamwork_score, coachability_score, attitude_score, overall_game_score, potential_flag")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  const testsCompleted = Object.values(testScores).filter((v) => v != null).length;

  const result = calculateFootballCampScore(
    testScores,
    coach ?? {},
    {
      attended: participant.attendance_status === "attended",
      testsCompleted,
      coachAssessmentDone: !!coach,
      resultsVerified: false,
      cohortSize,
    },
    athlete.age_group,
  );

  const now = new Date().toISOString();

  // Upsert athlete_camp_scores
  const { error: upsertError } = await supabase
    .from("athlete_camp_scores")
    .upsert(
      {
        camp_id: campId,
        athlete_id: athleteId,
        athletic_base_score: result.athletic_base_score,
        sport_skill_score: result.sport_skill_score,
        game_score: result.game_score,
        development_potential_score: result.development_potential_score,
        data_confidence_score: result.data_confidence_score,
        final_score_100: result.final_score_100,
        rating_10: result.rating_10,
        recommendation_category: result.recommendation_category,
        confidence_label: result.confidence_label,
        small_cohort_warning: result.small_cohort_warning,
        calculated_at: now,
      },
      { onConflict: "camp_id,athlete_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Update camp_participants with summary
  await supabase
    .from("camp_participants")
    .update({
      final_rating: result.rating_10,
      final_score_100: result.final_score_100,
      recommendation_category: result.recommendation_category,
      data_confidence_score: result.data_confidence_score,
      camp_verification_status: "camp_verified",
    })
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId);

  // Update athletes.latest_camp_* columns
  await supabase
    .from("athletes")
    .update({
      latest_camp_verified_at: now,
      latest_camp_rating: result.rating_10,
      latest_recommendation_category: result.recommendation_category,
    })
    .eq("id", athleteId);

  return NextResponse.json({
    rating_10: result.rating_10,
    final_score_100: result.final_score_100,
    recommendation_category: result.recommendation_category,
    confidence_label: result.confidence_label,
    small_cohort_warning: result.small_cohort_warning,
  });
}
