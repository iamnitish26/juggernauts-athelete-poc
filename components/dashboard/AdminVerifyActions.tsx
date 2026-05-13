"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { VerificationBadge } from "@/components/ui/Badge";

interface Props {
  athleteDbId: string;
  currentStatus: string;
  currentNotes: string;
}

const STATUS_TRANSITIONS = [
  { value: "self_registered", label: "Reset to Self Registered" },
  { value: "community_verified", label: "Mark Community Verified" },
  { value: "event_verified", label: "Mark Event Verified" },
  { value: "rejected", label: "Reject Profile" },
];

export default function AdminVerifyActions({ athleteDbId, currentStatus, currentNotes }: Props) {
  const [notes, setNotes] = useState(currentNotes);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function applyStatus(newStatus: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("athletes")
      .update({
        verification_status: newStatus,
        verification_notes: notes,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", athleteDbId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Log to verifications audit table
    await supabase.from("verifications").insert({
      athlete_id: athleteDbId,
      verified_by: user.id,
      previous_status: currentStatus,
      new_status: newStatus,
      notes,
    });

    setSuccess(`Status updated to: ${newStatus.replace("_", " ")}`);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Current status:</span>
        <VerificationBadge status={currentStatus} />
      </div>

      <Textarea
        label="Verification Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this verification decision..."
        hint="Notes are private to admins and volunteers"
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_TRANSITIONS.filter((s) => s.value !== currentStatus).map((s) => (
          <Button
            key={s.value}
            variant={s.value === "rejected" ? "danger" : s.value === "event_verified" ? "primary" : "secondary"}
            size="sm"
            onClick={() => applyStatus(s.value)}
            loading={loading}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl">{success}</p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}
    </div>
  );
}
