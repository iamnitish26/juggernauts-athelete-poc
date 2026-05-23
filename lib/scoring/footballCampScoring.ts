/**
 * Football Camp Scoring Utilities — JSF Camp Verified Module 1
 *
 * Scoring model (100 points total):
 *   Athletic Base:          25 pts  (30m Sprint, 5-10-5 Agility, Yo-Yo)
 *   Technical Skill:        35 pts  (Dribble Slalom, Passing, Shooting)
 *   Game / Coach:           25 pts  (coach 1–5 scores converted to 0–10)
 *   Development Potential:  10 pts  (coachability, attitude, potential flag)
 *   Data Confidence:         5 pts  (attendance, completion, verification, cohort)
 *
 * All test scores use camp-relative percentile scoring within:
 *   camp_id + age_group + gender
 *
 * TODO (future): Add age-group-specific weights:
 *   U-13  — emphasise movement quality and coachability
 *   U-15  — balance athletic base and technical skill
 *   U-17  — emphasise technical skill and game awareness
 *   U-19/Senior — emphasise match readiness and consistency
 */

export const FOOTBALL_SCORING_WEIGHTS = {
  athletic_base:         25,
  technical_skill:       35,
  game_assessment:       25,
  development_potential: 10,
  data_confidence:        5,
} as const;

/** Minimum cohort size for reliable percentile scoring. */
export const MIN_COHORT_SIZE = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Percentile scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate percentile rank (0–100) of athleteValue within cohort.
 *
 * lowerIsBetter=true  → faster/lower value gets higher percentile (sprint, agility)
 * lowerIsBetter=false → higher value gets higher percentile (yo-yo, passing, shooting)
 *
 * Uses "proportion beaten + half ties" convention.
 */
export function calculatePercentileScore(
  athleteValue: number,
  cohortValues: number[],
  lowerIsBetter: boolean,
): number {
  const n = cohortValues.length;
  if (n <= 1) return 50; // single athlete → return median

  const beaten = lowerIsBetter
    ? cohortValues.filter((v) => v > athleteValue).length
    : cohortValues.filter((v) => v < athleteValue).length;
  const tied = cohortValues.filter((v) => v === athleteValue).length;

  const percentile = ((beaten + 0.5 * tied) / n) * 100;
  return Math.min(100, Math.max(0, Math.round(percentile * 10) / 10));
}

/** Convert percentile (0–100) to a score out of 10 (one decimal). */
export function calculateTestScoreOutOf10(percentile: number): number {
  return Math.round((percentile / 10) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface AthleteTestScores {
  sprint?:   number | null; // score_out_of_10 — 30m Sprint
  agility?:  number | null; // score_out_of_10 — 5-10-5 Agility
  yoyo?:     number | null; // score_out_of_10 — Yo-Yo / Beep Test
  dribble?:  number | null; // score_out_of_10 — Dribble Slalom
  passing?:  number | null; // score_out_of_10 — Passing Accuracy
  shooting?: number | null; // score_out_of_10 — Shooting Accuracy
}

export interface CoachScores {
  first_touch_score?:       number | null;
  decision_making_score?:   number | null;
  off_ball_movement_score?: number | null;
  defensive_effort_score?:  number | null;
  communication_score?:     number | null;
  teamwork_score?:          number | null;
  coachability_score?:      number | null;
  attitude_score?:          number | null;
  overall_game_score?:      number | null;
  potential_flag?:          boolean;
}

export interface DataConfidenceInputs {
  attended:              boolean;
  testsCompleted:        number; // 0–6
  coachAssessmentDone:   boolean;
  resultsVerified:       boolean;
  cohortSize:            number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score calculations
// ─────────────────────────────────────────────────────────────────────────────

/** Athletic base sub-score out of 25. Average of available sprint/agility/yo-yo scores. */
export function calculateAthleticBaseScore(scores: AthleteTestScores): number {
  const vals = [scores.sprint, scores.agility, scores.yoyo].filter(
    (v): v is number => v != null,
  );
  if (vals.length === 0) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round((avg / 10) * FOOTBALL_SCORING_WEIGHTS.athletic_base * 10) / 10;
}

/** Technical skill sub-score out of 35. Average of available dribble/passing/shooting scores. */
export function calculateTechnicalSkillScore(scores: AthleteTestScores): number {
  const vals = [scores.dribble, scores.passing, scores.shooting].filter(
    (v): v is number => v != null,
  );
  if (vals.length === 0) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round((avg / 10) * FOOTBALL_SCORING_WEIGHTS.technical_skill * 10) / 10;
}

/**
 * Game/coach assessment sub-score out of 25.
 * Converts raw 1–5 scores to 0–10 scale, averages 7 core fields.
 */
export function calculateGameScore(coach: CoachScores): number {
  const rawScores = [
    coach.first_touch_score,
    coach.decision_making_score,
    coach.off_ball_movement_score,
    coach.defensive_effort_score,
    coach.communication_score,
    coach.teamwork_score,
    coach.overall_game_score,
  ].filter((v): v is number => v != null);

  if (rawScores.length === 0) return 0;
  const converted = rawScores.map((s) => ((s - 1) / 4) * 10); // 1→0, 3→5, 5→10
  const avg = converted.reduce((a, b) => a + b, 0) / converted.length;
  return Math.round((avg / 10) * FOOTBALL_SCORING_WEIGHTS.game_assessment * 10) / 10;
}

/**
 * Development potential sub-score out of 10.
 * Based on coachability + attitude scores (1–5) plus optional potential_flag bonus.
 */
export function calculateDevelopmentPotentialScore(coach: CoachScores): number {
  const vals = [coach.coachability_score, coach.attitude_score].filter(
    (v): v is number => v != null,
  );
  if (vals.length === 0) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const base = ((avg - 1) / 4) * 10;
  const capped = Math.min(10, base + (coach.potential_flag ? 1.0 : 0));
  return Math.round((capped / 10) * FOOTBALL_SCORING_WEIGHTS.development_potential * 10) / 10;
}

/**
 * Data confidence score out of 5, plus metadata.
 * Checks: attendance (1), tests ≥50% (1) or 100% (2), coach done (1), verified (1).
 * Small cohort (<5) is flagged but does not prevent scoring.
 */
export function calculateDataConfidence(inputs: DataConfidenceInputs): {
  score: number;
  label: "low" | "medium" | "high" | "verified_high";
  smallCohortWarning: boolean;
} {
  let points = 0;

  if (inputs.attended) points += 1;

  const testRatio = inputs.testsCompleted / 6;
  if (testRatio >= 1.0) points += 2;
  else if (testRatio >= 0.5) points += 1;

  if (inputs.coachAssessmentDone) points += 1;
  if (inputs.resultsVerified) points += 1;

  const smallCohortWarning = inputs.cohortSize < MIN_COHORT_SIZE;
  const score =
    Math.round((points / 5) * FOOTBALL_SCORING_WEIGHTS.data_confidence * 10) / 10;

  let label: "low" | "medium" | "high" | "verified_high";
  const ratio = points / 5;
  if (ratio >= 1.0 && !smallCohortWarning) label = "verified_high";
  else if (ratio >= 0.6) label = "high";
  else if (ratio >= 0.4) label = "medium";
  else label = "low";

  return { score, label, smallCohortWarning };
}

// ─────────────────────────────────────────────────────────────────────────────
// Master scoring and recommendation
// ─────────────────────────────────────────────────────────────────────────────

export interface FootballCampScoreResult {
  athletic_base_score:         number;
  sport_skill_score:           number;
  game_score:                  number;
  development_potential_score: number;
  data_confidence_score:       number;
  final_score_100:             number;
  rating_10:                   number;
  recommendation_category:
    | "JSF Recommended"
    | "JSF Watchlist"
    | "Development Track"
    | "Participation Track";
  confidence_label:   "low" | "medium" | "high" | "verified_high";
  small_cohort_warning: boolean;
}

/** Combine all sub-scores into a final 100-point score and rating. */
export function calculateFootballCampScore(
  testScores: AthleteTestScores,
  coachScores: CoachScores,
  dataConfidenceInputs: DataConfidenceInputs,
  ageGroup?: string | null,
): FootballCampScoreResult {
  const athletic_base_score         = calculateAthleticBaseScore(testScores);
  const sport_skill_score           = calculateTechnicalSkillScore(testScores);
  const game_score                  = calculateGameScore(coachScores);
  const development_potential_score = calculateDevelopmentPotentialScore(coachScores);
  const { score: data_confidence_score, label: confidence_label, smallCohortWarning: small_cohort_warning } =
    calculateDataConfidence(dataConfidenceInputs);

  const final_score_100 =
    athletic_base_score +
    sport_skill_score +
    game_score +
    development_potential_score +
    data_confidence_score;

  const rating_10 = Math.round((final_score_100 / 10) * 10) / 10;

  const recommendation_category = assignRecommendationCategory({
    rating_10,
    overall_game_score_raw: coachScores.overall_game_score,
    data_confidence_score,
    age_group: ageGroup,
    potential_flag: coachScores.potential_flag ?? false,
  });

  return {
    athletic_base_score,
    sport_skill_score,
    game_score,
    development_potential_score,
    data_confidence_score,
    final_score_100: Math.round(final_score_100 * 10) / 10,
    rating_10,
    recommendation_category,
    confidence_label,
    small_cohort_warning,
  };
}

/**
 * Assign recommendation category.
 *
 * JSF Recommended:   rating ≥ 8.0 AND game score ≥ 7/10 AND confidence ≥ 3.0
 * JSF Watchlist:     rating ≥ 7.0 OR (potential_flag AND young athlete U-13/U-15)
 * Development Track: rating ≥ 6.0
 * Participation Track: rating < 6.0
 *
 * TODO: implement age-group-specific weighting adjustments for U-13 and U-15.
 * Young athletes should be elevated more on potential_flag, coachability, and
 * movement quality rather than raw performance metrics.
 */
export function assignRecommendationCategory(params: {
  rating_10:             number;
  overall_game_score_raw?: number | null; // raw 1–5
  data_confidence_score: number;
  age_group?:            string | null;
  potential_flag:        boolean;
}): "JSF Recommended" | "JSF Watchlist" | "Development Track" | "Participation Track" {
  const { rating_10, overall_game_score_raw, data_confidence_score, age_group, potential_flag } = params;

  // Convert raw 1–5 overall game score to 0–10
  const gameScore10 =
    overall_game_score_raw != null ? ((overall_game_score_raw - 1) / 4) * 10 : 0;

  if (rating_10 >= 8.0 && gameScore10 >= 7.0 && data_confidence_score >= 3.0) {
    return "JSF Recommended";
  }

  // TODO: U-13/U-15 age-specific weighting — potential_flag alone can elevate to Watchlist
  const isYoung = age_group === "U-13" || age_group === "U-15";
  if (rating_10 >= 7.0 || (potential_flag && isYoung)) {
    return "JSF Watchlist";
  }

  if (rating_10 >= 6.0) return "Development Track";
  return "Participation Track";
}
