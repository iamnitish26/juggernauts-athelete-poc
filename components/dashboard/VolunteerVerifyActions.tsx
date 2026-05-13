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

export default function VolunteerVerifyActions({ athleteDbId, currentStatus, currentNotes }: Props) {
  const [notes, setNotes] = useState(currentNotes);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function applyVerification(newStatus: "community_verified" | "rejected") {
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

    setSuccess(`Athlete marked as: ${newStatus.replace("_", " ")}`);
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
        placeholder="How did you verify this athlete? (e.g. met at training, saw ID proof, confirmed with club)"
      />

      {currentStatus === "self_registered" && (
        <div className="flex gap-3">
          <Button
            onClick={() => applyVerification("community_verified")}
            loading={loading}
            className="flex-1"
          >
            ✓ Mark Community Verified
          </Button>
          <Button
            variant="danger"
            onClick={() => applyVerification("rejected")}
            loading={loading}
            className="flex-1"
          >
            ✕ Reject
          </Button>
        </div>
      )}

      {currentStatus !== "self_registered" && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          This profile has already been actioned. Only admins can change it further.
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl">{success}</p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}
    </div>
  );
}
