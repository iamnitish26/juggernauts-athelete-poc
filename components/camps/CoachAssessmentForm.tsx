"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { CheckCircle, Lock } from "lucide-react";

interface Props {
  campId: string;
  athleteId: string;
  existing: {
    id?: string;
    first_touch_score?: number | null;
    decision_making_score?: number | null;
    off_ball_movement_score?: number | null;
    defensive_effort_score?: number | null;
    communication_score?: number | null;
    teamwork_score?: number | null;
    coachability_score?: number | null;
    attitude_score?: number | null;
    overall_game_score?: number | null;
    potential_flag?: boolean | null;
    private_notes?: string | null;
    public_summary?: string | null;
  } | null;
}

const SCORE_FIELDS: { key: string; label: string }[] = [
  { key: "first_touch_score",       label: "First Touch" },
  { key: "decision_making_score",   label: "Decision Making" },
  { key: "off_ball_movement_score", label: "Off-Ball Movement" },
  { key: "defensive_effort_score",  label: "Defensive Effort" },
  { key: "communication_score",     label: "Communication" },
  { key: "teamwork_score",          label: "Teamwork" },
  { key: "coachability_score",      label: "Coachability" },
  { key: "attitude_score",          label: "Attitude" },
  { key: "overall_game_score",      label: "Overall Game" },
];

type ScoreKey = typeof SCORE_FIELDS[number]["key"];

function ScoreSelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={[
            "w-8 h-8 rounded-lg text-sm font-bold transition-colors border",
            value === n
              ? "bg-[#5B21B6] text-white border-[#5B21B6]"
              : "bg-white text-gray-500 border-gray-200 hover:border-[#5B21B6] hover:text-[#5B21B6]",
          ].join(" ")}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function CoachAssessmentForm({ campId, athleteId, existing }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [scores, setScores] = useState<Record<ScoreKey, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const f of SCORE_FIELDS) {
      init[f.key] = (existing as Record<string, number | null> | null)?.[f.key] ?? null;
    }
    return init as Record<ScoreKey, number | null>;
  });

  const [potentialFlag, setPotentialFlag] = useState(existing?.potential_flag ?? false);
  const [privateNotes, setPrivateNotes] = useState(existing?.private_notes ?? "");
  const [publicSummary, setPublicSummary] = useState(existing?.public_summary ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      camp_id: campId,
      athlete_id: athleteId,
      sport: "Football",
      ...scores,
      potential_flag: potentialFlag,
      private_notes: privateNotes || null,
      public_summary: publicSummary || null,
      assessed_by: user?.id ?? null,
    };

    let err = null;
    if (existing?.id) {
      const res = await supabase.from("coach_assessments").update(payload).eq("id", existing.id);
      err = res.error;
    } else {
      const res = await supabase.from("coach_assessments").insert(payload);
      err = res.error;
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-gray-700 shrink-0">{label}</span>
            <ScoreSelector
              value={scores[key as ScoreKey]}
              onChange={(v) => setScores((prev) => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Potential flag */}
      <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
        <input
          id="potential_flag"
          type="checkbox"
          checked={potentialFlag}
          onChange={(e) => setPotentialFlag(e.target.checked)}
          className="w-4 h-4 accent-[#5B21B6]"
        />
        <label htmlFor="potential_flag" className="text-sm font-medium text-blue-900 cursor-pointer">
          High Potential Flag
          <span className="block text-xs font-normal text-blue-600 mt-0.5">
            Marks athlete for JSF Watchlist consideration — especially relevant for U-13/U-15 athletes.
          </span>
        </label>
      </div>

      {/* Public summary */}
      <Textarea
        label="Public Summary (optional)"
        value={publicSummary}
        onChange={(e) => setPublicSummary(e.target.value)}
        placeholder="A brief public note about this athlete's camp performance..."
        rows={2}
        hint="Shown on public profile only if public summary is enabled. Keep general and positive."
      />

      {/* Private notes */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Private Notes</span>
          <span className="text-xs text-gray-400">(admin only — never shown publicly)</span>
        </div>
        <Textarea
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          placeholder="Internal coaching notes, concerns, follow-up actions..."
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-200">{error}</p>}

      <Button onClick={handleSave} loading={saving}>
        {saved ? <><CheckCircle className="w-4 h-4 text-green-400" /> Saved</> : "Save Assessment"}
      </Button>
    </div>
  );
}
