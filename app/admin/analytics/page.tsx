import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { Users, Trophy, MapPin, CheckCircle } from "lucide-react";

export const metadata = { title: "Analytics | Admin" };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    { count: total },
    { data: athletes },
    { data: events },
    { data: registrations },
  ] = await Promise.all([
    supabase.from("athletes").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("athletes").select("primary_sport, district, age_group, verification_status, gender").eq("is_active", true),
    supabase.from("events").select("id, name, status"),
    supabase.from("event_registrations").select("id, event_id"),
  ]);

  // Aggregate
  const bySport: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};
  const byAgeGroup: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byGender: Record<string, number> = {};

  athletes?.forEach((a) => {
    bySport[a.primary_sport] = (bySport[a.primary_sport] ?? 0) + 1;
    byDistrict[a.district] = (byDistrict[a.district] ?? 0) + 1;
    byAgeGroup[a.age_group] = (byAgeGroup[a.age_group] ?? 0) + 1;
    byStatus[a.verification_status] = (byStatus[a.verification_status] ?? 0) + 1;
    byGender[a.gender] = (byGender[a.gender] ?? 0) + 1;
  });

  const sortedSports = Object.entries(bySport).sort((a, b) => b[1] - a[1]);
  const sortedDistricts = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const sortedAgeGroups = ["U-13", "U-15", "U-17", "U-19", "Senior"].map((ag) => [ag, byAgeGroup[ag] ?? 0] as [string, number]);
  const sortedStatus = Object.entries(byStatus);

  const totalEvents = events?.length ?? 0;
  const totalRegistrations = registrations?.length ?? 0;

  function BarRow({ label, count, max, color = "bg-[#5B21B6]" }: { label: string; count: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 w-28 shrink-0 truncate">{label}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-gray-900 w-6 text-right">{count}</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Athletes" value={total ?? 0} icon={<Users className="w-5 h-5 text-[#5B21B6]" />} color="bg-purple-50" />
        <StatCard label="Total Events" value={totalEvents} icon={<Trophy className="w-5 h-5 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Event Registrations" value={totalRegistrations} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-50" />
        <StatCard label="Districts Covered" value={Object.keys(byDistrict).length} icon={<MapPin className="w-5 h-5 text-orange-600" />} color="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Athletes by Sport</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {sortedSports.map(([sport, count]) => (
                <BarRow key={sport} label={sport} count={count} max={total ?? 1} color="bg-[#5B21B6]" />
              ))}
              {!sortedSports.length && <p className="text-xs text-gray-400">No data yet</p>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Athletes by District (Top 10)</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {sortedDistricts.map(([district, count]) => (
                <BarRow key={district} label={district} count={count} max={total ?? 1} color="bg-[#7C3AED]" />
              ))}
              {!sortedDistricts.length && <p className="text-xs text-gray-400">No data yet</p>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Athletes by Age Group</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {sortedAgeGroups.map(([ag, count]) => (
                <BarRow key={ag} label={ag} count={count} max={total ?? 1} color="bg-blue-500" />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Verification Status Split</h2></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { key: "self_registered", label: "Self Registered", color: "bg-yellow-400" },
                { key: "community_verified", label: "Community Verified", color: "bg-blue-500" },
                { key: "event_verified", label: "Event Verified", color: "bg-green-500" },
                { key: "rejected", label: "Rejected", color: "bg-red-400" },
              ].map(({ key, label, color }) => (
                <BarRow key={key} label={label} count={byStatus[key] ?? 0} max={total ?? 1} color={color} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900">Gender Breakdown</h2></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-6">
            {Object.entries(byGender).map(([gender, count]) => (
              <div key={gender} className="text-center">
                <div className="text-2xl font-bold text-[#5B21B6]">{count}</div>
                <div className="text-xs text-gray-500 mt-0.5 capitalize">{gender.replace("_", " ")}</div>
              </div>
            ))}
            {!Object.keys(byGender).length && <p className="text-xs text-gray-400">No data yet</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
