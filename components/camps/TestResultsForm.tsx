"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle } from "lucide-react";

interface TestDef {
  id: string;
  test_name: string;
  test_category: string;
  unit: string;
  lower_is_better: boolean;
}

interface ExistingResult {
  id: string;
  attempt_1?: number | null;
  attempt_2?: number | null;
  attempt_3?: number | null;
  best_value?: number | null;
  notes?: string | null;
  percentile_score?: number | null;
  score_out_of_10?: number | null;
}

interface Props {
  campId: string;
  athleteId: string;
  testDefs: TestDef[];
  existingResults: Record<string, ExistingResult>;
}

const CATEGORIES: Record<string, string> = {
  athletic_base: "Athletic Base",
  technical_skill: "Technical Skill",
};

export default function TestResultsForm({ campId, athleteId, testDefs, existingResults }: Props) {
  const supabase = createClient();
  const router = useRouter();

  // Local state per test_definition_id
  const [values, setValues] = useState<Record<string, { attempt_1: string; attempt_2: string; attempt_3: string; notes: string }>>(
    () => {
      const init: Record<string, { attempt_1: string; attempt_2: string; attempt_3: string; notes: string }> = {};
      for (const def of testDefs) {
        const ex = existingResults[def.id];
        init[def.id] = {
          attempt_1: ex?.attempt_1?.toString() ?? "",
          attempt_2: ex?.attempt_2?.toString() ?? "",
          attempt_3: ex?.attempt_3?.toString() ?? "",
          notes: ex?.notes ?? "",
        };
      }
      return init;
    }
  );

  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getBestValue(defId: string, lowerIsBetter: boolean): number | null {
    const v = values[defId];
    const nums = [v.attempt_1, v.attempt_2, v.attempt_3]
      .map((s) => parseFloat(s))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) return null;
    return lowerIsBetter ? Math.min(...nums) : Math.max(...nums);
  }

  async function saveTest(def: TestDef) {
    setSaving(def.id);
    setErrors((e) => ({ ...e, [def.id]: "" }));

    const v = values[def.id];
    const a1 = v.attempt_1 ? parseFloat(v.attempt_1) : null;
    const a2 = v.attempt_2 ? parseFloat(v.attempt_2) : null;
    const a3 = v.attempt_3 ? parseFloat(v.attempt_3) : null;
    const best = getBestValue(def.id, def.lower_is_better);

    const { data: { user } } = await supabase.auth.getUser();

    const existing = existingResults[def.id];

    if (existing) {
      const { error } = await supabase
        .from("test_results")
        .update({
          attempt_1: a1,
          attempt_2: a2,
          attempt_3: a3,
          best_value: best,
          raw_value: best,
          unit: def.unit,
          notes: v.notes || null,
        })
        .eq("id", existing.id);
      if (error) { setErrors((e) => ({ ...e, [def.id]: error.message })); setSaving(null); return; }
    } else {
      const { error } = await supabase.from("test_results").insert({
        camp_id: campId,
        athlete_id: athleteId,
        test_definition_id: def.id,
        attempt_1: a1,
        attempt_2: a2,
        attempt_3: a3,
        best_value: best,
        raw_value: best,
        unit: def.unit,
        notes: v.notes || null,
        recorded_by: user?.id ?? null,
      });
      if (error) { setErrors((e) => ({ ...e, [def.id]: error.message })); setSaving(null); return; }
    }

    setSaving(null);
    setSaved((s) => ({ ...s, [def.id]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [def.id]: false })), 2000);
    router.refresh();
  }

  const grouped: Record<string, TestDef[]> = {};
  for (const def of testDefs) {
    const cat = def.test_category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(def);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, defs]) => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {CATEGORIES[cat] ?? cat}
          </h3>
          <div className="space-y-4">
            {defs.map((def) => {
              const v = values[def.id];
              const best = getBestValue(def.id, def.lower_is_better);
              const ex = existingResults[def.id];
              return (
                <div key={def.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{def.test_name}</p>
                      <p className="text-xs text-gray-400">{def.unit} · {def.lower_is_better ? "lower is better" : "higher is better"}</p>
                    </div>
                    {ex?.score_out_of_10 != null && (
                      <span className="text-xs font-bold text-[#5B21B6] bg-purple-50 px-2 py-0.5 rounded-full">
                        Score: {ex.score_out_of_10.toFixed(1)}/10
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["attempt_1", "attempt_2", "attempt_3"] as const).map((att, i) => (
                      <Input
                        key={att}
                        label={`Attempt ${i + 1}`}
                        type="number"
                        step="0.01"
                        value={v[att]}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [def.id]: { ...prev[def.id], [att]: e.target.value },
                          }))
                        }
                        placeholder="—"
                      />
                    ))}
                  </div>
                  {best != null && (
                    <p className="text-xs text-gray-500">
                      Best: <strong>{best} {def.unit}</strong>
                    </p>
                  )}
                  {errors[def.id] && (
                    <p className="text-xs text-red-600">{errors[def.id]}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveTest(def)}
                    loading={saving === def.id}
                  >
                    {saved[def.id] ? (
                      <><CheckCircle className="w-3.5 h-3.5 text-green-600" /> Saved</>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
