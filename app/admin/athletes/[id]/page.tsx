import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import AdminVerifyActions from "@/components/dashboard/AdminVerifyActions";
import AdminProfileActions from "@/components/dashboard/AdminProfileActions";
import AdminAthleteEditForm from "@/components/dashboard/AdminAthleteEditForm";
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Lock,
  User,
  Globe,
  EyeOff,
  Info,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Athlete Detail | Admin" };

const PROFILE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  inactive: "Inactive",
};

const PROFILE_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
};

export default async function AdminAthleteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !athlete) notFound();

  const age = (() => {
    if (!athlete.date_of_birth) return null;
    const birth = new Date(athlete.date_of_birth);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      a--;
    return a;
  })();

  // Fetch approver/rejecter profile names if present
  const approverPromise = athlete.approved_by
    ? supabase.from("profiles").select("full_name, email").eq("id", athlete.approved_by).single()
    : Promise.resolve({ data: null });
  const rejecterPromise = athlete.rejected_by
    ? supabase.from("profiles").select("full_name, email").eq("id", athlete.rejected_by).single()
    : Promise.resolve({ data: null });

  const [{ data: approver }, { data: rejecter }] = await Promise.all([
    approverPromise,
    rejecterPromise,
  ]);

  // Data quality checks
  const qualityChecks = [
    {
      label: "Profile photo uploaded",
      pass: !!athlete.profile_photo_url,
    },
    {
      label: "Photo consent given",
      pass: athlete.photo_consent === true,
    },
    {
      label: "Achievement summary filled",
      pass: !!athlete.achievement_summary?.trim(),
    },
    {
      label: "Club / School provided",
      pass: !!athlete.current_club_school?.trim(),
    },
    {
      label: "Position / Event filled",
      pass: !!athlete.position_event_category?.trim(),
    },
    {
      label: "Guardian info present (if minor)",
      pass: age === null || age >= 18 || !!athlete.guardian_name,
    },
    {
      label: "Instagram or video link provided",
      pass: !!(athlete.instagram_link || athlete.video_link),
    },
  ];

  const passCount = qualityChecks.filter((c) => c.pass).length;
  const isProfileApproved = athlete.profile_status === "approved";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/athletes" className="hover:text-[#5B21B6]">
          Athletes
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{athlete.full_name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{athlete.full_name}</h1>
          <p className="font-mono text-sm text-[#5B21B6] mt-0.5">{athlete.athlete_id}</p>
          <p className="text-xs text-gray-400 mt-1">
            Registered {new Date(athlete.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              PROFILE_STATUS_COLOR[athlete.profile_status ?? "pending"] ??
              "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {PROFILE_STATUS_LABEL[athlete.profile_status ?? "pending"] ?? athlete.profile_status}
          </span>
          <VerificationBadge status={athlete.verification_status} />
        </div>
      </div>

      {/* ── Status Overview ────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {/* Public profile status */}
          <div className="pb-4 sm:pb-0 sm:pr-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Public Profile Status
            </p>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-sm font-semibold px-2.5 py-1 rounded-full border ${
                  PROFILE_STATUS_COLOR[athlete.profile_status ?? "pending"] ??
                  "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {PROFILE_STATUS_LABEL[athlete.profile_status ?? "pending"] ?? athlete.profile_status}
              </span>
              {isProfileApproved && (
                <Link
                  href={`/athlete/${athlete.athlete_id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-[#5B21B6] hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  View live profile
                </Link>
              )}
            </div>
            {isProfileApproved ? (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Public profile is live and visible to anyone.
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5 shrink-0" />
                Public profile is currently hidden.
              </p>
            )}
          </div>

          {/* Verification status */}
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Verification Status
            </p>
            <div className="mb-1">
              <VerificationBadge status={athlete.verification_status} />
            </div>
            <p className="text-xs text-gray-500">
              Controls the trust badge shown on the public profile.
            </p>
          </div>
        </div>

        {/* Contextual banner */}
        {!isProfileApproved &&
          (athlete.verification_status === "community_verified" ||
            athlete.verification_status === "event_verified") && (
            <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 flex items-start gap-2.5 text-sm text-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <span className="font-semibold">Verification is not the same as publishing.</span>{" "}
                This profile is{" "}
                {athlete.verification_status === "community_verified"
                  ? "Community Verified"
                  : "Event Verified"}{" "}
                but the public profile is still hidden. To make it visible, use{" "}
                <span className="font-semibold">Approve Public Profile</span> in the Profile Actions
                section below.
              </span>
            </div>
          )}

        {!isProfileApproved &&
          athlete.verification_status === "self_registered" &&
          athlete.profile_status === "pending" && (
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-start gap-2.5 text-sm text-gray-600">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
              <span>
                Profile is pending review. You can optionally verify the athlete first, then use{" "}
                <span className="font-semibold">Approve Public Profile</span> to publish it.
              </span>
            </div>
          )}
      </div>
      {/* ── End Status Overview ─────────────────────────────────────── */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Personal details */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Personal Details</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Gender", athlete.gender ?? "—"],
                [
                  "Date of Birth",
                  athlete.date_of_birth
                    ? `${athlete.date_of_birth}${age !== null ? ` (Age ${age})` : ""}`
                    : "—",
                ],
                ["Age Group", athlete.age_group ?? "—"],
                ["State", athlete.state ?? "—"],
                ["District", athlete.district ?? "—"],
                ["City / Block", athlete.city_block || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Sport details */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Sport Information</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Primary Sport", athlete.primary_sport ?? "—"],
                ["Position / Event", athlete.position_event_category || "—"],
                ["Dominant Side", athlete.dominant_side || "—"],
                ["Club / School", athlete.current_club_school || "—"],
                [
                  "Experience",
                  athlete.years_of_experience ? `${athlete.years_of_experience} years` : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Private contact — admin only */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Contact Details</h2>
              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Private
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Athlete Phone", athlete.athlete_phone || "—"],
                ["Athlete Email", athlete.athlete_email || "—"],
                ["Guardian Name", athlete.guardian_name || "—"],
                ["Guardian Phone", athlete.guardian_phone || "—"],
                ["Guardian Relationship", athlete.guardian_relationship || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Achievements & media */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Achievements &amp; Media</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {athlete.achievement_summary || (
                <span className="italic text-gray-400">No achievement summary provided.</span>
              )}
            </p>
            <dl className="space-y-2 text-sm">
              {athlete.video_link && (
                <div>
                  <dt className="text-gray-500 text-xs mb-0.5">Highlight Video</dt>
                  <a
                    href={athlete.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5B21B6] hover:underline text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {athlete.video_link}
                  </a>
                </div>
              )}
              {athlete.instagram_link && (
                <div>
                  <dt className="text-gray-500 text-xs mb-0.5">Instagram</dt>
                  <p className="text-xs text-gray-700">{athlete.instagram_link}</p>
                </div>
              )}
              {athlete.profile_photo_url && (
                <div>
                  <dt className="text-gray-500 text-xs mb-0.5">Profile Photo</dt>
                  <a
                    href={athlete.profile_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5B21B6] hover:underline text-xs flex items-center gap-1"
                  >
                    <User className="w-3 h-3" />
                    View photo
                    {athlete.photo_consent ? " (consent given)" : " (no consent)"}
                  </a>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Registration source — shown when assisted */}
      {athlete.registration_source && athlete.registration_source !== "self" && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Registration Source</h2>
              <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {athlete.registration_source}
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ["Registration Source", athlete.registration_source],
                ["Created By Role", athlete.created_by_role || "—"],
                ["Source Organisation", athlete.source_organisation || "—"],
                ["Source Team Name", athlete.source_team_name || "—"],
                ["Source Contact Name", athlete.source_contact_name || "—"],
                ["Source Contact Phone", athlete.source_contact_phone || "—"],
                [
                  "Guardian Consent Status",
                  (athlete.guardian_consent_status ?? "not_required").replace(/_/g, " "),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                  <dd className="font-medium text-gray-900 capitalize">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}

      {/* Guardian consent pending warning */}
      {athlete.guardian_consent_status === "pending" && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Guardian consent pending.</span> This athlete appears to
          be a minor and guardian consent has not been confirmed. Follow up before approving this
          profile publicly.
        </div>
      )}

      {/* Data quality checks */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Data Quality Checks</h2>
            <span className="text-xs font-semibold text-gray-500">
              {passCount}/{qualityChecks.length} passing
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {qualityChecks.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  check.pass
                    ? "bg-green-50 text-green-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {check.pass ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                )}
                {check.label}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Profile actions */}
        <Card className={!isProfileApproved ? "ring-2 ring-[#5B21B6]/20 border-[#5B21B6]/30" : ""}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#5B21B6]" />
              <h2 className="font-semibold text-gray-900">Profile Actions</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Controls whether this profile is <strong>publicly visible</strong>. Separate from
              verification.
            </p>
          </CardHeader>
          <CardBody>
            <AdminProfileActions
              athleteDbId={athlete.id}
              currentProfileStatus={athlete.profile_status ?? "pending"}
              currentRejectionReason={athlete.rejection_reason ?? ""}
            />

            {/* Audit trail */}
            {(athlete.approved_at || athlete.rejected_at) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                {athlete.approved_at && (
                  <p>
                    Approved on{" "}
                    {new Date(athlete.approved_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {approver && (
                      <span> by {approver.full_name ?? approver.email}</span>
                    )}
                  </p>
                )}
                {athlete.rejected_at && (
                  <p>
                    Rejected on{" "}
                    {new Date(athlete.rejected_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {rejecter && (
                      <span> by {rejecter.full_name ?? rejecter.email}</span>
                    )}
                  </p>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Verification actions */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Verification Actions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Controls the trust badge only.{" "}
              <span className="font-semibold text-amber-700">
                Does not publish the profile.
              </span>
            </p>
          </CardHeader>
          <CardBody>
            <AdminVerifyActions
              athleteDbId={athlete.id}
              currentStatus={athlete.verification_status}
              currentNotes={athlete.verification_notes ?? ""}
            />
          </CardBody>
        </Card>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Edit Profile</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Make corrections to athlete data. Changes are saved immediately.
          </p>
        </CardHeader>
        <CardBody>
          <AdminAthleteEditForm athlete={athlete} />
        </CardBody>
      </Card>
    </div>
  );
}
