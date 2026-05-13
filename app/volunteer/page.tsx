import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { CheckCircle, Clock, Users } from "lucide-react";

export const metadata = { title: "Volunteer Dashboard | Juggernauts" };

export default async function VolunteerDashboard() {
  const supabase = await createClient();

  const [
    { count: pending },
    { count: verifiedToday },
    { data: pendingAthletes },
  ] = await Promise.all([
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "self_registered"),
    supabase
      .from("athletes")
      .select("*", { count: "exact", head: true })
      .neq("verification_status", "self_registered")
      .gte("verified_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("athletes")
      .select("id, athlete_id, full_name, primary_sport, district, age_group, created_at")
      .eq("verification_status", "self_registered")
      .order("created_at", { ascending: true })
      .limit(15),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Help verify grassroots athletes in Odisha
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Pending Verification"
          value={pending ?? 0}
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          color="bg-yellow-50"
          subtitle="Athletes waiting for review"
        />
        <StatCard
          label="Verified Today"
          value={verifiedToday ?? 0}
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Your Impact"
          value="∞"
          icon={<Users className="w-5 h-5 text-[#5B21B6]" />}
          color="bg-purple-50"
          subtitle="Every verified athlete matters"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Athletes Pending Verification</h2>
            <Link
              href="/volunteer/verify"
              className="text-xs text-[#5B21B6] hover:underline font-medium"
            >
              Search all
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-gray-50">
            {pendingAthletes?.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {a.primary_sport} · {a.district} · {a.age_group}
                  </p>
                  <p className="font-mono text-xs text-[#7C3AED]">{a.athlete_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <VerificationBadge status="self_registered" />
                  <Link
                    href={`/volunteer/verify/${a.id}`}
                    className="text-xs bg-[#5B21B6] text-white px-3 py-1.5 rounded-lg hover:bg-[#4C1D95] transition-colors font-medium"
                  >
                    Verify
                  </Link>
                </div>
              </div>
            ))}
            {!pendingAthletes?.length && (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  All caught up! No athletes pending verification.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
