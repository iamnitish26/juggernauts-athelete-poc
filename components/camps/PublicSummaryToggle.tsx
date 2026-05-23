"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  participantCampId: string;
  athleteId: string;
  currentEnabled: boolean;
}

export default function PublicSummaryToggle({ participantCampId, athleteId, currentEnabled }: Props) {
  const [enabled, setEnabled] = useState(currentEnabled);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggle() {
    setLoading(true);
    const next = !enabled;
    const { error } = await supabase
      .from("camp_participants")
      .update({ public_summary_enabled: next })
      .eq("camp_id", participantCampId)
      .eq("athlete_id", athleteId);
    setLoading(false);
    if (!error) {
      setEnabled(next);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">Show camp result on public profile</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Only shows rating and recommendation if profile is approved and public.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={[
          "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
          enabled
            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300",
        ].join(" ")}
      >
        {enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        {enabled ? "Public" : "Private"}
      </button>
    </div>
  );
}
