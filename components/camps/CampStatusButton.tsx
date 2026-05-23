"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

interface Props {
  campId: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { next: string; label: string }> = {
  draft:     { next: "open",      label: "Open Camp" },
  open:      { next: "completed", label: "Mark Completed" },
  completed: { next: "completed", label: "Completed" },
  cancelled: { next: "cancelled", label: "Cancelled" },
};

export default function CampStatusButton({ campId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const transition = TRANSITIONS[currentStatus];
  if (!transition || transition.next === currentStatus) return null;

  async function handleAdvance() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("camps")
      .update({ status: transition.next })
      .eq("id", campId);
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.refresh();
  }

  return (
    <div>
      <Button size="sm" onClick={handleAdvance} loading={loading}>
        {transition.label}
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
