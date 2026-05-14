import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Trophy,
  AlertCircle,
  FileCheck,
  Download,
  BarChart3,
  Lock,
  ShieldCheck,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard | Juggernauts" };

const PROFILE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending Review",
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

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalAthletes },
    { count: pendingProfiles },
    { count: pendingVerification },
    { count: communityVerified },
    { count: eventVerified },
    { count: totalEvents },
    { data: recentAthletes },
    { data: actionRequired },
    { data: byDistrict },
    { data: bySport },
  ] = await Promise.all([
    supabase.from("athletes").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("profile_status", "pending"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "self_registered")
      .eq("profile_status", "approved"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "community_verified"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "event_verified"),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase
      .from("athletes")
      .select("id, athlete_id, full_name, primary_sport, district, verification_status, profile_status, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("athletes")
      .select("id, athlete_id, full_name, primary_sport, district, created_at")
      .eq("profile_status", "pending")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(5),
    supabase.from("athletes").select("district").eq("is_active", true),
    supabase.from("athletes").select("primary_sport").eq("is_active", true),
  ]);

  const districtCounts: Record<string, number> = {};
  byDistrict?.forEach((a) => {
    districtCounts[a.district] = (districtCounts[a.district] ?? 0) + 1;
  });

  const sportCounts: Record<string, number> = {};
  bySport?.forEach((a) => {
    sportCounts[a.primary_sport] = (sportCounts[a.primary_sport] ?? 0) + 1;
  });

  const topDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topSports = Object.entries(sportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hasPendingAction = (pendingProfiles ?? 0) > 0 || (pendingVerification ?? 0) > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of athlete registrations and platform activity
        </p>
      </div>

      {/* Privacy reminder */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 text-sm text-amber-800">
        <Lock className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Privacy reminder:</span> Athlete contact details
          (phone, email, date of birth, guardian info) visible here are private and must not
          be shared externally. Public profiles show only sport, district, and age group.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Athletes"
          value={totalAthletes ?? 0}
          icon={<Users className="w-5 h-5 text-[#5B21B6]" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingProfiles ?? 0}
          icon={<FileCheck className="w-5 h-5 text-orange-600" />}
          color="bg-orange-50"
          subtitle="Profiles awaiting review"
        />
        <StatCard
          label="Pending Verification"
          value={pendingVerification ?? 0}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          color="bg-yellow-50"
          subtitle="Approved, unverified"
        />
        <StatCard
          label="Community Verified"
          value={communityVerified ?? 0}
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Event Verified"
          value={eventVerified ?? 0}
          icon={<Trophy className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Active Events"
          value={totalEvents ?? 0}
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          color="bg-indigo-50"
        />
      </div>

      {/* Action required */}
      {hasPendingAction && (
        <Card variant="bordered" className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h2 className="font-semibold text-gray-900">Action Required</h2>
              {(pendingProfiles ?? 0) > 0 && (
                <span className="text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  {pendingProfiles}
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {actionRequired && actionRequired.length > 0 ? (
              <div className="space-y-2 mb-3">
                {actionRequired.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/athletes/${a.id}`}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 hover:bg-orange-50 border border-orange-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{a.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {a.primary_sport} · {a.district} ·{" "}
                        <span className="font-mono">{a.athlete_id}</span>
                      </p>
                    </div>
                    <span className="text-xs text-orange-700 font-medium">Review →</span>
                  </Link>
                ))}
                {(pendingProfiles ?? 0) > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    and {(pendingProfiles ?? 0) - 5} more…
                  </p>
                )}
              </div>
            ) : null}
            <Link
              href="/admin/athletes?profile_status=pending"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              <FileCheck className="w-4 h-4" />
              Review all pending profiles ({pendingProfiles ?? 0})
            </Link>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent registrations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Registrations</h2>
                <Link
                  href="/admin/athletes"
                  className="text-xs text-[#5B21B6] hover:underline font-medium"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-50">
                {recentAthletes?.map((a) => (
                  <Link
                    key={a.id}
                    href={`/admin/athletes/${a.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{a.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {a.primary_sport} · {a.district} ·{" "}
                        <span className="font-mono">{a.athlete_id}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          PROFILE_STATUS_COLOR[a.profile_status ?? "pending"] ??
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {PROFILE_STATUS_LABEL[a.profile_status ?? "pending"] ?? a.profile_status}
                      </span>
                      <VerificationBadge status={a.verification_status} />
                    </div>
                  </Link>
                ))}
                {!recentAthletes?.length && (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">
                    No registrations yet
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Side stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Top Sports</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {topSports.map(([sport, count]) => (
                  <div key={sport} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{sport}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[#5B21B6] h-1.5 rounded-full"
                          style={{ width: `${Math.round((count / (totalAthletes || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
                {!topSports.length && <p className="text-xs text-gray-400">No data yet</p>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Top Districts</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {topDistricts.map(([district, count]) => (
                  <div key={district} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{district}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-[#7C3AED] h-1.5 rounded-full"
                          style={{ width: `${Math.round((count / (totalAthletes || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
                {!topDistricts.length && (
                  <p className="text-xs text-gray-400">No data yet</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card variant="bordered">
        <CardBody>
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/athletes?profile_status=pending">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-800 text-sm font-medium hover:bg-orange-100 transition-colors">
                <FileCheck className="w-4 h-4" />
                Review Profile Approvals ({pendingProfiles ?? 0})
              </button>
            </Link>
            <Link href="/admin/athletes?verification_status=self_registered">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 text-yellow-800 text-sm font-medium hover:bg-yellow-100 transition-colors">
                <ShieldCheck className="w-4 h-4" />
                Review Verifications ({pendingVerification ?? 0})
              </button>
            </Link>
            <Link href="/admin/events/new">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-[#5B21B6] text-sm font-medium hover:bg-purple-100 transition-colors">
                <Calendar className="w-4 h-4" />
                Create Event
              </button>
            </Link>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed"
              title="Coming soon"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <Link href="/admin/analytics">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
