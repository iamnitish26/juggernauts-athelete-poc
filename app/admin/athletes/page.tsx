import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Search, Lock, ExternalLink, UserPlus } from "lucide-react";

interface SearchParams {
  profile_status?: string;
  verification_status?: string;
  registration_source?: string;
  guardian_consent?: string;
  sport?: string;
  district?: string;
  age_group?: string;
  q?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = { title: "Athletes | Admin" };

const PROFILE_STATUS_OPTIONS = [
  { label: "All Profiles", value: "" },
  { label: "Pending Review", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Inactive", value: "inactive" },
];

const VERIFICATION_STATUS_OPTIONS = [
  { label: "All Verifications", value: "" },
  { label: "Self Registered", value: "self_registered" },
  { label: "Community Verified", value: "community_verified" },
  { label: "Event Verified", value: "event_verified" },
];

const SOURCE_OPTIONS = [
  { label: "All Sources", value: "" },
  { label: "Self", value: "self" },
  { label: "Volunteer", value: "volunteer" },
  { label: "Admin", value: "admin" },
  { label: "Captain", value: "captain" },
  { label: "Coach", value: "coach" },
];

const CONSENT_OPTIONS = [
  { label: "All Consent", value: "" },
  { label: "Not Required", value: "not_required" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
];

const PROFILE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  inactive: "Inactive",
};

const PROFILE_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
};

const SOURCE_LABEL: Record<string, string> = {
  self: "Self",
  volunteer: "Volunteer",
  admin: "Admin",
  captain: "Captain",
  coach: "Coach",
  bulk_upload: "Bulk Upload",
  event_registration: "Event",
};

const SOURCE_COLOR: Record<string, string> = {
  self: "bg-gray-100 text-gray-600",
  volunteer: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
  captain: "bg-indigo-100 text-indigo-800",
  coach: "bg-teal-100 text-teal-800",
  bulk_upload: "bg-orange-100 text-orange-800",
};

const CONSENT_COLOR: Record<string, string> = {
  not_required: "bg-gray-100 text-gray-500",
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

function buildHref(base: SearchParams, override: Partial<SearchParams>): string {
  const merged = { ...base, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v as string);
  }
  const qs = params.toString();
  return `/admin/athletes${qs ? `?${qs}` : ""}`;
}

export default async function AdminAthletesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select(
      "id, athlete_id, full_name, primary_sport, district, age_group, gender, verification_status, profile_status, registration_source, guardian_consent_status, is_public, created_at, achievement_summary, profile_photo_url"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (sp.profile_status) query = query.eq("profile_status", sp.profile_status);
  if (sp.verification_status) query = query.eq("verification_status", sp.verification_status);
  if (sp.registration_source) query = query.eq("registration_source", sp.registration_source);
  if (sp.guardian_consent) query = query.eq("guardian_consent_status", sp.guardian_consent);
  if (sp.sport) query = query.eq("primary_sport", sp.sport);
  if (sp.district) query = query.eq("district", sp.district);
  if (sp.age_group) query = query.eq("age_group", sp.age_group);
  if (sp.q) query = query.ilike("full_name", `%${sp.q}%`);

  const { data: athletes } = await query;

  const hasActiveFilter =
    sp.profile_status ||
    sp.verification_status ||
    sp.registration_source ||
    sp.guardian_consent ||
    sp.sport ||
    sp.district ||
    sp.age_group ||
    sp.q;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {athletes?.length ?? 0} athlete{(athletes?.length ?? 0) !== 1 ? "s" : ""}
            {hasActiveFilter ? " (filtered)" : ""}
          </p>
        </div>
        <Link
          href="/admin/athletes/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#3B0764] text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create Athlete ID
        </Link>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-4">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        Contact details (phone, email, DOB, guardian) are visible only on individual athlete detail pages. This list shows only public-safe fields.
      </div>

      {/* Search */}
      <form method="GET" className="mb-4">
        {sp.profile_status && (
          <input type="hidden" name="profile_status" value={sp.profile_status} />
        )}
        {sp.verification_status && (
          <input type="hidden" name="verification_status" value={sp.verification_status} />
        )}
        {sp.registration_source && (
          <input type="hidden" name="registration_source" value={sp.registration_source} />
        )}
        {sp.guardian_consent && (
          <input type="hidden" name="guardian_consent" value={sp.guardian_consent} />
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search athletes by name…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/30 focus:border-[#5B21B6]"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        {/* Profile status */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center mr-1 font-medium">Profile:</span>
          {PROFILE_STATUS_OPTIONS.map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { profile_status: value })}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                (sp.profile_status ?? "") === value
                  ? "bg-[#5B21B6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Verification status */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center mr-1 font-medium">Verification:</span>
          {VERIFICATION_STATUS_OPTIONS.map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { verification_status: value })}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                (sp.verification_status ?? "") === value
                  ? "bg-[#5B21B6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Registration source */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center mr-1 font-medium">Source:</span>
          {SOURCE_OPTIONS.map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { registration_source: value })}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                (sp.registration_source ?? "") === value
                  ? "bg-[#5B21B6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Guardian consent */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center mr-1 font-medium">Guardian Consent:</span>
          {CONSENT_OPTIONS.map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { guardian_consent: value })}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                (sp.guardian_consent ?? "") === value
                  ? "bg-[#5B21B6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {hasActiveFilter && (
          <div>
            <Link
              href="/admin/athletes"
              className="text-xs text-[#5B21B6] hover:underline font-medium"
            >
              Clear all filters
            </Link>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Athlete",
                    "Athlete ID",
                    "Sport",
                    "District",
                    "Profile",
                    "Source",
                    "Consent",
                    "Verification",
                    "Registered",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {athletes?.map((athlete) => {
                  const hasPhoto = !!athlete.profile_photo_url;
                  const hasAchievement = !!athlete.achievement_summary;
                  const missingData = !hasPhoto || !hasAchievement;

                  return (
                    <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                            {athlete.full_name}
                            {missingData && (
                              <span
                                className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold"
                                title="Missing photo or achievement summary"
                              >
                                Incomplete
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {athlete.age_group} · {athlete.gender}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[#5B21B6]">
                          {athlete.athlete_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {athlete.primary_sport}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {athlete.district}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            PROFILE_STATUS_COLOR[athlete.profile_status ?? "pending"] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {PROFILE_STATUS_LABEL[athlete.profile_status ?? "pending"] ??
                            athlete.profile_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            SOURCE_COLOR[athlete.registration_source ?? "self"] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {SOURCE_LABEL[athlete.registration_source ?? "self"] ??
                            athlete.registration_source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            CONSENT_COLOR[athlete.guardian_consent_status ?? "not_required"] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {(athlete.guardian_consent_status ?? "not_required").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VerificationBadge status={athlete.verification_status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(athlete.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/athletes/${athlete.id}`}
                            className="text-xs text-[#5B21B6] hover:underline font-medium whitespace-nowrap"
                          >
                            Review
                          </Link>
                          {athlete.is_public && (
                            <Link
                              href={`/athlete/${athlete.athlete_id}`}
                              target="_blank"
                              className="text-gray-400 hover:text-[#5B21B6]"
                              title="View public profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!athletes?.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No athletes found
                      {hasActiveFilter && (
                        <span>
                          {" "}—{" "}
                          <Link href="/admin/athletes" className="text-[#5B21B6] hover:underline">
                            clear filters
                          </Link>
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {athletes?.map((athlete) => {
          const hasPhoto = !!athlete.profile_photo_url;
          const hasAchievement = !!athlete.achievement_summary;
          const missingData = !hasPhoto || !hasAchievement;

          return (
            <div
              key={athlete.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{athlete.full_name}</p>
                  <p className="font-mono text-xs text-[#5B21B6] mt-0.5">{athlete.athlete_id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      PROFILE_STATUS_COLOR[athlete.profile_status ?? "pending"] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {PROFILE_STATUS_LABEL[athlete.profile_status ?? "pending"]}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      SOURCE_COLOR[athlete.registration_source ?? "self"] ??
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {SOURCE_LABEL[athlete.registration_source ?? "self"]}
                  </span>
                  <VerificationBadge status={athlete.verification_status} />
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {athlete.primary_sport} · {athlete.age_group} · {athlete.district}
              </p>

              {missingData && (
                <p className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg mb-2 font-medium">
                  Incomplete:{" "}
                  {[!hasPhoto && "missing photo", !hasAchievement && "missing achievements"]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              {athlete.guardian_consent_status === "pending" && (
                <p className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg mb-2 font-medium">
                  Guardian consent pending
                </p>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <Link
                  href={`/admin/athletes/${athlete.id}`}
                  className="text-xs text-[#5B21B6] hover:underline font-medium"
                >
                  Review →
                </Link>
                {athlete.is_public && (
                  <Link
                    href={`/athlete/${athlete.athlete_id}`}
                    target="_blank"
                    className="text-xs text-gray-400 hover:text-[#5B21B6] flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Public profile
                  </Link>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(athlete.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {!athletes?.length && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No athletes found
            {hasActiveFilter && (
              <div className="mt-2">
                <Link href="/admin/athletes" className="text-[#5B21B6] hover:underline text-xs">
                  Clear filters
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
