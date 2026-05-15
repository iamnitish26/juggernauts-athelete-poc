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

    await supabase.from("verifications").insert({
      athlete_id: athleteDbId,
      verified_by: user.id,
      previous_status: currentStatus,
      new_status: newStatus,
      notes,
    });

    setSuccess(`Verification updated to: ${newStatus.replace(/_/g, " ")}`);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Current verification:</span>
        <VerificationBadge status={currentStatus} />
      </div>

      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
        Verification controls the trust badge displayed on the public profile. It does{" "}
        <strong>not</strong> make the profile publicly visible — use{" "}
        <strong>Approve Public Profile</strong> in the Profile Actions card for that.
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
            variant={
              s.value === "event_verified"
                ? "primary"
                : s.value === "community_verified"
                ? "secondary"
                : "outline"
            }
            size="sm"
            onClick={() => applyStatus(s.value)}
            loading={loading}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
