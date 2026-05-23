import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ campId: string }>;
}

function escapeCsv(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields: unknown[]): string {
  return fields.map(escapeCsv).join(",");
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { campId } = await params;
  const type = req.nextUrl.searchParams.get("type") ?? "shortlist";
  const supabase = await createClient();

  // Auth: admin only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  // Load camp
  const { data: camp } = await supabase.from("camps").select("name, sport, camp_date").eq("id", campId).single();
  if (!camp) return new NextResponse("Camp not found", { status: 404 });

  // Load participants with athlete and score data
  const { data: participants } = await supabase
    .from("camp_participants")
    .select(`
      athlete_id, recommendation_category, final_rating, final_score_100,
      athletes(athlete_id, full_name, age_group, gender, district, primary_sport),
      athlete_camp_scores(
        athletic_base_score, sport_skill_score, game_score,
        development_potential_score, data_confidence_score,
        final_score_100, rating_10, recommendation_category, confidence_label, small_cohort_warning
      )
    `)
    .eq("camp_id", campId);

  // Load test results per athlete
  const athleteIds = (participants ?? []).map((p) => p.athlete_id);
  const testResultsByAthlete: Record<string, Record<string, number | null>> = {};

  if (athleteIds.length > 0) {
    const { data: testResults } = await supabase
      .from("test_results")
      .select("athlete_id, test_definition_id, best_value")
      .eq("camp_id", campId)
      .in("athlete_id", athleteIds);

    const TEST_IDS: Record<string, string> = {
      "00000001-0000-0000-0000-000000000000": "sprint",
      "00000002-0000-0000-0000-000000000000": "agility",
      "00000003-0000-0000-0000-000000000000": "yoyo",
      "00000004-0000-0000-0000-000000000000": "dribble",
      "00000005-0000-0000-0000-000000000000": "passing",
      "00000006-0000-0000-0000-000000000000": "shooting",
    };

    for (const tr of testResults ?? []) {
      if (!testResultsByAthlete[tr.athlete_id]) testResultsByAthlete[tr.athlete_id] = {};
      const name = TEST_IDS[tr.test_definition_id] ?? tr.test_definition_id;
      testResultsByAthlete[tr.athlete_id][name] = tr.best_value;
    }
  }

  const rows: string[] = [];

  if (type === "shortlist") {
    rows.push(csvRow([
      "Athlete Name", "Athlete ID", "Sport", "Age Group", "Gender",
      "District", "Camp", "Rating (/ 10)", "Recommendation", "Confidence",
    ]));

    for (const p of participants ?? []) {
      const a = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
      const s = Array.isArray(p.athlete_camp_scores) ? p.athlete_camp_scores[0] : p.athlete_camp_scores;
      if (!s || !s.recommendation_category) continue; // shortlist = scored only
      rows.push(csvRow([
        a?.full_name, a?.athlete_id, a?.primary_sport ?? camp.sport, a?.age_group,
        a?.gender, a?.district, camp.name, s?.rating_10?.toFixed(1),
        s?.recommendation_category, s?.confidence_label,
      ]));
    }
  } else {
    rows.push(csvRow([
      "Athlete Name", "Athlete ID", "Age Group", "Gender", "District",
      "30m Sprint (s)", "5-10-5 Agility (s)", "Yo-Yo Level",
      "Dribble Slalom (s)", "Passing Accuracy (/10)", "Shooting Accuracy (/10)",
      "Athletic Base Score", "Technical Skill Score", "Game Score",
      "Dev Potential Score", "Data Confidence Score",
      "Final Score (/100)", "Rating (/10)", "Recommendation", "Confidence", "Small Cohort",
    ]));

    for (const p of participants ?? []) {
      const a = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
      const s = Array.isArray(p.athlete_camp_scores) ? p.athlete_camp_scores[0] : p.athlete_camp_scores;
      const t = testResultsByAthlete[p.athlete_id] ?? {};
      rows.push(csvRow([
        a?.full_name, a?.athlete_id, a?.age_group, a?.gender, a?.district,
        t.sprint, t.agility, t.yoyo, t.dribble, t.passing, t.shooting,
        s?.athletic_base_score?.toFixed(1), s?.sport_skill_score?.toFixed(1),
        s?.game_score?.toFixed(1), s?.development_potential_score?.toFixed(1),
        s?.data_confidence_score?.toFixed(1), s?.final_score_100?.toFixed(1),
        s?.rating_10?.toFixed(1), s?.recommendation_category, s?.confidence_label,
        s?.small_cohort_warning ? "Yes" : "No",
      ]));
    }
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="camp-${type}-${campId.slice(0, 8)}.csv"`,
    },
  });
}
