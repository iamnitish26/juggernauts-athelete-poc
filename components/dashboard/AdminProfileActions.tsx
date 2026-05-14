"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { CheckCircle, XCircle, EyeOff } from "lucide-react";

interface Props {
  athleteDbId: string;
  currentProfileStatus: string;
  currentRejectionReason: string;
}

export default function AdminProfileActions({
  athleteDbId,
  currentProfileStatus,
  currentRejectionReason,
}: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(currentRejectionReason ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function applyProfileStatus(
    newStatus: "approved" | "rejected" | "inactive",
    reason?: string
  ) {
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

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { profile_status: newStatus };

    if (newStatus === "approved") {
      patch.is_public = true;
      patch.approved_at = now;
      patch.approved_by = user.id;
      patch.rejected_at = null;
      patch.rejected_by = null;
      patch.rejection_reason = null;
    } else if (newStatus === "rejected") {
      patch.is_public = false;
      patch.rejected_at = now;
      patch.rejected_by = user.id;
      patch.rejection_reason = reason ?? "";
      patch.approved_at = null;
      patch.approved_by = null;
    } else {
      patch.is_public = false;
    }

    const { error: updateError } = await supabase
      .from("athletes")
      .update(patch)
      .eq("id", athleteDbId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(
      newStatus === "approved"
        ? "Profile approved and made public."
        : newStatus === "rejected"
        ? "Profile rejected."
        : "Profile marked inactive."
    );
    setShowRejectForm(false);
    setLoading(false);
    router.refresh();
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    inactive: "Inactive",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
    approved: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Current profile status:</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            statusColor[currentProfileStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {statusLabel[currentProfileStatus] ?? currentProfileStatus}
        </span>
      </div>

      {currentProfileStatus === "rejected" && currentRejectionReason && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <span className="font-semibold">Rejection reason: </span>
          {currentRejectionReason}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {currentProfileStatus !== "approved" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => applyProfileStatus("approved")}
            loading={loading}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Approve Public Profile
          </Button>
        )}

        {currentProfileStatus !== "rejected" && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowRejectForm((v) => !v)}
            disabled={loading}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject Profile
          </Button>
        )}

        {currentProfileStatus !== "inactive" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyProfileStatus("inactive")}
            loading={loading}
          >
            <EyeOff className="w-3.5 h-3.5 mr-1" />
            Mark Inactive
          </Button>
        )}

        {currentProfileStatus === "rejected" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyProfileStatus("approved")}
            loading={loading}
          >
            Re-approve Profile
          </Button>
        )}

        {currentProfileStatus === "inactive" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyProfileStatus("approved")}
            loading={loading}
          >
            Re-activate &amp; Approve
          </Button>
        )}
      </div>

      {showRejectForm && (
        <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this profile is being rejected (required)..."
            hint="This reason is stored for internal audit. The athlete may be notified separately."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => applyProfileStatus("rejected", rejectionReason)}
              loading={loading}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRejectForm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
