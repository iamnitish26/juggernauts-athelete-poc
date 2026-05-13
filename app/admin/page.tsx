import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { Users, CheckCircle, Clock, Calendar, Trophy, AlertCircle } from "lucide-react";

export const metadata = { title: "Admin Dashboard | Juggernauts" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch aggregate stats in parallel
  const [
    { count: totalAthletes },
    { count: pendingVerification },
    { count: communityVerified },
    { count: eventVerified },
    { data: recentAthletes },
    { data: byDistrict },
    { data: bySport },
    { count: totalEvents },
  ] = await Promise.all([
    supabase.from("athletes").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "self_registered"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "community_verified"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "event_verified"),
    supabase
      .from("athletes")
      .select("id, athlete_id, full_name, primary_sport, district, verification_status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("athletes")
      .select("district")
      .eq("is_active", true),
    supabase
      .from("athletes")
      .select("primary_sport")
      .eq("is_active", true),
    supabase.from("events").select("*", { count: "exact", head: true }),
  ]);

  // Tally district and sport counts client-side from fetched data
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of athlete registrations and platform activity
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Athletes"
          value={totalAthletes ?? 0}
          icon={<Users className="w-5 h-5 text-[#5B21B6]" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Pending Verification"
          value={pendingVerification ?? 0}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          color="bg-yellow-50"
          subtitle="Awaiting volunteer review"
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
      </div>

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
                      <p className="text-sm font-semibold text-gray-900">
                        {a.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.primary_sport} · {a.district} ·{" "}
                        <span className="font-mono">{a.athlete_id}</span>
                      </p>
                    </div>
                    <VerificationBadge status={a.verification_status} />
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
                          style={{
                            width: `${Math.round((count / (totalAthletes || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
                {!topSports.length && (
                  <p className="text-xs text-gray-400">No data yet</p>
                )}
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
                          style={{
                            width: `${Math.round((count / (totalAthletes || 1)) * 100)}%`,
                          }}
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
            <Link href="/admin/athletes?status=self_registered">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 text-yellow-800 text-sm font-medium hover:bg-yellow-100 transition-colors">
                <AlertCircle className="w-4 h-4" />
                Review Pending ({pendingVerification ?? 0})
              </button>
            </Link>
            <Link href="/admin/events/new">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-[#5B21B6] text-sm font-medium hover:bg-purple-100 transition-colors">
                <Calendar className="w-4 h-4" />
                Create Event
              </button>
            </Link>
            <Link href="/admin/analytics">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
                <Users className="w-4 h-4" />
                View Analytics
              </button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
