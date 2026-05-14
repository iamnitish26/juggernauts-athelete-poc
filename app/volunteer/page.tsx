import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  UserPlus,
  AlertTriangle,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata = { title: "Volunteer Dashboard | Juggernauts" };

const PROFILE_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-600",
};

export default async function VolunteerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { count: myTotal },
    { count: myPendingApproval },
    { count: myNeedsGuardianConsent },
    { count: myCommunityVerified },
    { data: myAthletes },
    { count: globalPendingVerification },
  ] = await Promise.all([
    // Total athletes I created
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("created_by_user_id", user?.id ?? ""),
    // My athletes awaiting admin approval
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("created_by_user_id", user?.id ?? "")
      .eq("profile_status", "pending"),
    // My athletes with pending guardian consent
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("created_by_user_id", user?.id ?? "")
      .eq("guardian_consent_status", "pending"),
    // My athletes I community-verified
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verified_by", user?.id ?? "")
      .eq("verification_status", "community_verified"),
    // My submitted athletes list
    supabase
      .from("athletes")
      .select(
        "id, athlete_id, full_name, primary_sport, district, age_group, profile_status, guardian_consent_status, verification_status, created_at"
      )
      .eq("created_by_user_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(10),
    // Global platform — all athletes awaiting verification (for community verifier role)
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "self_registered")
      .eq("profile_status", "approved"),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and track athlete profiles for grassroots athletes in Odisha
        </p>
      </div>

      {/* Create CTA */}
      <div className="mb-6">
        <Link
          href="/volunteer/athletes/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5B21B6] hover:bg-[#3B0764] text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Create Athlete ID
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="My Submitted Athletes"
          value={myTotal ?? 0}
          icon={<Users className="w-5 h-5 text-[#5B21B6]" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Pending Admin Approval"
          value={myPendingApproval ?? 0}
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
          subtitle="Awaiting admin review"
        />
        <StatCard
          label="Needs Guardian Consent"
          value={myNeedsGuardianConsent ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          label="Community Verified by Me"
          value={myCommunityVerified ?? 0}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My submitted athletes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">My Submitted Athletes</h2>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-50">
                {myAthletes?.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{a.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {a.primary_sport} · {a.district} · {a.age_group}
                      </p>
                      <p className="font-mono text-xs text-[#7C3AED] mt-0.5">{a.athlete_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          PROFILE_STATUS_COLOR[a.profile_status ?? "pending"] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.profile_status === "approved"
                          ? "Approved"
                          : a.profile_status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                      </span>
                      {a.guardian_consent_status === "pending" && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                          Consent Pending
                        </span>
                      )}
                      <VerificationBadge status={a.verification_status} />
                    </div>
                  </div>
                ))}
                {!myAthletes?.length && (
                  <div className="px-6 py-12 text-center">
                    <UserPlus className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No athletes submitted yet.
                    </p>
                    <Link
                      href="/volunteer/athletes/new"
                      className="text-xs text-[#5B21B6] hover:underline mt-1 inline-block"
                    >
                      Create your first Athlete ID →
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Community verification */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Community Verification</h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-3">
                Help verify athlete profiles that are awaiting community verification.
              </p>
              <div className="bg-purple-50 rounded-xl p-3 text-center mb-3">
                <p className="text-2xl font-bold text-[#5B21B6]">
                  {globalPendingVerification ?? 0}
                </p>
                <p className="text-xs text-gray-500">Athletes to verify</p>
              </div>
              <Link
                href="/volunteer/verify"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#3B0764] text-white text-sm font-medium transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Go to Verification Queue
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Permissions</h2>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-xs text-gray-600">
                {[
                  { can: true, text: "Create athlete profiles" },
                  { can: true, text: "View your submitted athletes" },
                  { can: true, text: "Mark Community Verified" },
                  { can: true, text: "Add verification notes" },
                  { can: false, text: "Approve profiles publicly" },
                  { can: false, text: "Reject profiles" },
                  { can: false, text: "Access all platform data" },
                ].map(({ can, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    {can ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span className={can ? "text-gray-700" : "text-gray-400"}>{text}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
