"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "@/lib/constants";

interface Props {
  participantId: string;
  currentStatus: string;
}

const CYCLE: string[] = ["registered", "attended", "absent", "withdrawn"];

export default function AttendanceButton({ participantId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function cycle() {
    const nextIdx = (CYCLE.indexOf(status) + 1) % CYCLE.length;
    const next = CYCLE[nextIdx];
    setLoading(true);

    const { error } = await supabase
      .from("camp_participants")
      .update({ attendance_status: next })
      .eq("id", participantId);

    setLoading(false);
    if (!error) {
      setStatus(next);
      router.refresh();
    }
  }

  const color = ATTENDANCE_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
  const label = ATTENDANCE_STATUS_LABELS[status] ?? status;

  return (
    <button
      onClick={cycle}
      disabled={loading}
      className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${color}`}
      title="Click to cycle attendance status"
    >
      {loading ? "..." : label}
    </button>
  );
}
