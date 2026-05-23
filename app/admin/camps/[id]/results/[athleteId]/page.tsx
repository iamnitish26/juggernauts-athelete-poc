import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import {
  RECOMMENDATION_CATEGORY_COLORS,
  CAMP_VERIFICATION_STATUS_LABELS,
  CAMP_VERIFICATION_STATUS_COLORS,
} from "@/lib/constants";
import TestResultsForm from "@/components/camps/TestResultsForm";
import CoachAssessmentForm from "@/components/camps/CoachAssessmentForm";
import CalculateScoreButton from "@/components/camps/CalculateScoreButton";
import PublicSummaryToggle from "@/components/camps/PublicSummaryToggle";

interface PageProps {
  params: Promise<{ id: string; athleteId: string }>;
}

export const metadata = { title: "Athlete Results | Admin Camps" };

export default async function CampAthleteResultsPage({ params }: PageProps) {
  const { id: campId, athleteId } = await params;
  const supabase = await createClient();

  // Load camp
  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, name, status")
    .eq("id", campId)
    .single();
  if (campError || !camp) notFound();

  // Load athlete
  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("id, athlete_id, full_name, primary_sport, age_group, gender, district, verification_status, date_of_birth")
    .eq("id", athleteId)
    .single();
  if (athleteError || !athlete) notFound();

  // Load participant record
  const { data: participant } = await supabase
    .from("camp_participants")
    .select("*")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId)
    .single();

  // Load test definitions for football
  const { data: testDefs } = await supabase
    .from("test_definitions")
    .select("id, test_name, test_category, unit, lower_is_better")
    .eq("sport", "Football")
    .eq("is_active", true)
    .order("test_category");

  // Load this athlete's test results
  const { data: testResults } = await supabase
    .from("test_results")
    .select("*, test_definitions(test_name, unit, lower_is_better)")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId);

  // Load coach assessment
  const { data: coachAssessment } = await supabase
    .from("coach_assessments")
    .select("*")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  // Load calculated scores
  const { data: scores } = await supabase
    .from("athlete_camp_scores")
    .select("*")
    .eq("camp_id", campId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  const verifColor = CAMP_VERIFICATION_STATUS_COLORS[participant?.camp_verification_status ?? "not_started"] ?? "bg-gray-100 text-gray-600";
  const verifLabel = CAMP_VERIFICATION_STATUS_LABELS[participant?.camp_verification_status ?? "not_started"] ?? "Not Started";

  // Build test results map for form initial values
  const testResultsByDefId: Record<string, { id: string; attempt_1?: number | null; attempt_2?: number | null; attempt_3?: number | null; best_value?: number | null; notes?: string | null; percentile_score?: number | null; score_out_of_10?: number | null }> = {};
  for (const tr of testResults ?? []) {
    testResultsByDefId[tr.test_definition_id] = tr;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <Link href={`/admin/camps/${campId}`} className="hover:text-[#5B21B6] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          {camp.name}
        </Link>
        <span>/</span>
        <Link href={`/admin/camps/${campId}/participants`} className="hover:text-[#5B21B6]">Participants</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{athlete.full_name}</span>
      </div>

      {/* Athlete summary */}
      <Card>
        <CardBody className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{athlete.full_name}</h1>
              <p className="font-mono text-sm text-[#5B21B6] mt-0.5">{athlete.athlete_id}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                <span>{athlete.primary_sport}</span>
                <span>·</span>
                <span>{athlete.age_group}</span>
                <span>·</span>
                <span>{athlete.gender}</span>
                <span>·</span>
                <span>{athlete.district}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${verifColor}`}>
                {verifLabel}
              </span>
              {participant?.attendance_status && (
                <span className="text-xs text-gray-500">
                  Attendance: <strong>{participant.attendance_status}</strong>
                </span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Calculated score panel */}
      {scores ? (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">JSF Camp Score</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-4xl font-black text-[#5B21B6]">{scores.rating_10?.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Rating / 10</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{scores.final_score_100?.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Score / 100</p>
              </div>
              {scores.recommendation_category && (
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${RECOMMENDATION_CATEGORY_COLORS[scores.recommendation_category] ?? "bg-gray-100 text-gray-600"}`}>
                  {scores.recommendation_category}
                </span>
              )}
              {scores.small_cohort_warning && (
                <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Small cohort — score less reliable
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {[
                { label: "Athletic Base", value: scores.athletic_base_score, max: 25 },
                { label: "Technical Skill", value: scores.sport_skill_score, max: 35 },
                { label: "Game Score", value: scores.game_score, max: 25 },
                { label: "Development", value: scores.development_potential_score, max: 10 },
                { label: "Confidence", value: scores.data_confidence_score, max: 5 },
              ].map(({ label, value, max }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-gray-900">{value?.toFixed(1) ?? "—"}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label} / {max}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-gray-400">
                Calculated: {scores.calculated_at ? new Date(scores.calculated_at).toLocaleString() : "—"} · Confidence: {scores.confidence_label ?? "—"}
              </p>
              <CalculateScoreButton campId={campId} athleteId={athleteId} />
            </div>

            <PublicSummaryToggle
              participantCampId={campId}
              athleteId={athleteId}
              currentEnabled={participant?.public_summary_enabled ?? false}
            />

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
              JSF Camp Verified recommendations are for further evaluation and do not guarantee selection.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-5 text-center space-y-3">
            <p className="text-sm text-gray-600">No score calculated yet. Enter test results and coach assessment below, then calculate.</p>
            <CalculateScoreButton campId={campId} athleteId={athleteId} />
          </CardBody>
        </Card>
      )}

      {/* Test results */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Test Results</h2>
          <p className="text-xs text-gray-400 mt-0.5">Enter raw values. Best value and scores are calculated automatically on score calculation.</p>
        </CardHeader>
        <CardBody>
          <TestResultsForm
            campId={campId}
            athleteId={athleteId}
            testDefs={testDefs ?? []}
            existingResults={testResultsByDefId}
          />
        </CardBody>
      </Card>

      {/* Coach assessment */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Coach Assessment</h2>
          <p className="text-xs text-gray-400 mt-0.5">Score 1–5. Private notes are admin-only and never shown publicly.</p>
        </CardHeader>
        <CardBody>
          <CoachAssessmentForm
            campId={campId}
            athleteId={athleteId}
            existing={coachAssessment}
          />
        </CardBody>
      </Card>
    </div>
  );
}
