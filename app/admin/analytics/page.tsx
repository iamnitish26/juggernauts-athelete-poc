import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import AnalyticsExportButtons from "@/components/dashboard/AnalyticsExportButtons";
import Link from "next/link";
import {
  Users,
  Trophy,
  MapPin,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Globe,
  BarChart2,
} from "lucide-react";

export const metadata = { title: "Analytics | Admin" };

const ODISHA_TOTAL_DISTRICTS = 30;

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

function getSince(range?: string): string | null {
  if (range === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "90d") return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function BarRow({
  label,
  count,
  max,
  color = "bg-[#5B21B6]",
  sublabel,
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
  sublabel?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <span className="text-sm text-gray-700 truncate block">{label}</span>
        {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-900 w-8 text-right">{count}</span>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-[#5B21B6]">{icon}</div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const { range } = await searchParams;
  const since = getSince(range);
  const supabase = await createClient();

  // ── Parallel data fetching ──────────────────────────────────────────────
  let athleteQuery = supabase
    .from("athletes")
    .select(
      "primary_sport, district, age_group, verification_status, gender, profile_status, is_public, profile_photo_url, guardian_consent_status, achievement_summary, current_club_school"
    )
    .eq("is_active", true);
  if (since) athleteQuery = athleteQuery.gte("created_at", since);

  let regQuery = supabase
    .from("event_registrations")
    .select("event_id, registration_status, payment_status, amount");
  if (since) regQuery = regQuery.gte("registered_at", since);

  const [
    { data: athletes },
    { data: events },
    { data: registrations },
    { count: inactiveCount },
    { count: totalAthletes },
  ] = await Promise.all([
    athleteQuery,
    supabase.from("events").select("id, status"),
    regQuery,
    supabase.from("athletes").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("athletes").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  // ── Athlete aggregations ────────────────────────────────────────────────
  const bySport: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};
  const byAgeGroup: Record<string, number> = {};
  const byVerification: Record<string, number> = {};
  const byGender: Record<string, number> = {};
  const byProfileStatus: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };

  let publicCount = 0;
  let missingPhoto = 0;
  let pendingConsent = 0;
  let missingAchievement = 0;
  let missingClub = 0;

  for (const a of athletes ?? []) {
    bySport[a.primary_sport] = (bySport[a.primary_sport] ?? 0) + 1;
    byDistrict[a.district] = (byDistrict[a.district] ?? 0) + 1;
    byAgeGroup[a.age_group] = (byAgeGroup[a.age_group] ?? 0) + 1;
    byVerification[a.verification_status] = (byVerification[a.verification_status] ?? 0) + 1;
    byGender[a.gender] = (byGender[a.gender] ?? 0) + 1;

    const ps = a.profile_status as string;
    if (ps in byProfileStatus) byProfileStatus[ps]++;

    if (a.is_public) publicCount++;
    if (!a.profile_photo_url) missingPhoto++;
    if (a.guardian_consent_status === "pending") pendingConsent++;
    if (!a.achievement_summary) missingAchievement++;
    if (!a.current_club_school) missingClub++;
  }

  const athleteCount = athletes?.length ?? 0;
  const districtCount = Object.keys(byDistrict).length;
  const districtPct = Math.round((districtCount / ODISHA_TOTAL_DISTRICTS) * 100);
  const sportsCount = Object.keys(bySport).length;
  const verifiedCount =
    (byVerification["community_verified"] ?? 0) + (byVerification["event_verified"] ?? 0);

  const sortedSports    = Object.entries(bySport).sort((a, b) => b[1] - a[1]);
  const sortedDistricts = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const ageGroupOrder   = ["U-13", "U-15", "U-17", "U-19", "Senior"];
  const sortedAgeGroups = ageGroupOrder.map((ag) => [ag, byAgeGroup[ag] ?? 0] as [string, number]);

  // ── Registration / payment aggregations ────────────────────────────────
  const totalRegistrations  = registrations?.length ?? 0;
  const confirmedRegs       = registrations?.filter((r) => r.registration_status === "confirmed").length ?? 0;
  const pendingPayments     = registrations?.filter((r) => r.payment_status === "pending").length ?? 0;
  const failedPayments      = registrations?.filter((r) => r.payment_status === "failed").length ?? 0;
  const totalCollected      = registrations
    ?.filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) ?? 0;

  // ── Event aggregations ──────────────────────────────────────────────────
  const totalEvents = events?.length ?? 0;
  const openEvents  = events?.filter((e) => e.status === "open").length ?? 0;

  // ── Gender display order ────────────────────────────────────────────────
  const genderRows = [
    { key: "male",              label: "Male",              color: "bg-blue-500" },
    { key: "female",            label: "Female",            color: "bg-pink-500" },
    { key: "other",             label: "Other",             color: "bg-purple-400" },
    { key: "prefer_not_to_say", label: "Prefer not to say", color: "bg-gray-400" },
  ];

  const rangeLabel = range === "30d" ? "Last 30 Days" : range === "90d" ? "Last 90 Days" : "All Time";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide statistics · <span className="font-medium text-[#5B21B6]">{rangeLabel}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 items-end">
          {/* Date range tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {[
              { label: "All Time",    value: "" },
              { label: "Last 30d",   value: "30d" },
              { label: "Last 90d",   value: "90d" },
            ].map(({ label, value }) => (
              <Link
                key={label}
                href={value ? `/admin/analytics?range=${value}` : "/admin/analytics"}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                  (!range && !value) || range === value
                    ? "bg-white text-[#5B21B6] shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </div>
          <AnalyticsExportButtons range={range} />
        </div>
      </div>

      {/* ── Pilot Snapshot ─────────────────────────────────────────────── */}
      <section>
        <SectionTitle icon={<BarChart2 className="w-5 h-5" />} title="Pilot Snapshot" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Athletes Registered",  value: athleteCount,              sub: `${since ? rangeLabel : "Total"}` },
            { label: "Sports Represented",   value: sportsCount },
            { label: "Districts Covered",    value: `${districtCount} / ${ODISHA_TOTAL_DISTRICTS}`, sub: `${districtPct}% of Odisha` },
            { label: "Verified Athletes",    value: verifiedCount,             sub: "Community + Event" },
            { label: "Events Created",       value: totalEvents,               sub: `${openEvents} open` },
            { label: "Public Profiles",      value: publicCount },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] rounded-2xl p-4 text-white">
              <p className="text-xs text-purple-200 font-medium leading-snug">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {sub && <p className="text-xs text-purple-300 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Platform Overview ───────────────────────────────────────────── */}
      <section>
        <SectionTitle icon={<Users className="w-5 h-5" />} title="Platform Overview" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Athletes"
            value={since ? athleteCount : (totalAthletes ?? 0)}
            icon={<Users className="w-5 h-5 text-[#5B21B6]" />}
            color="bg-purple-50"
            subtitle={since ? `Registered in ${rangeLabel.toLowerCase()}` : undefined}
          />
          <StatCard
            label="Total Events"
            value={totalEvents}
            icon={<Trophy className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            label="Event Registrations"
            value={totalRegistrations}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Districts Covered"
            value={`${districtCount} / ${ODISHA_TOTAL_DISTRICTS}`}
            icon={<MapPin className="w-5 h-5 text-orange-600" />}
            color="bg-orange-50"
            subtitle={`${districtPct}% of Odisha`}
          />
        </div>
      </section>

      {/* ── Profile & Verification ──────────────────────────────────────── */}
      <section>
        <SectionTitle icon={<ShieldCheck className="w-5 h-5" />} title="Profile & Verification" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Profile Status Split */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Profile Status Split</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { key: "pending",  label: "Pending Approval", color: "bg-yellow-400" },
                  { key: "approved", label: "Approved",         color: "bg-green-500" },
                  { key: "rejected", label: "Rejected",         color: "bg-red-400" },
                  { key: "inactive", label: "Inactive",         color: "bg-gray-400" },
                ].map(({ key, label, color }) => (
                  <BarRow
                    key={key}
                    label={label}
                    count={key === "inactive" ? (inactiveCount ?? 0) : (byProfileStatus[key] ?? 0)}
                    max={athleteCount + (inactiveCount ?? 0) || 1}
                    color={color}
                  />
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Verification Status Split */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Verification Status Split</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { key: "self_registered",    label: "Self Registered",    color: "bg-yellow-400" },
                  { key: "community_verified", label: "Community Verified", color: "bg-blue-500" },
                  { key: "event_verified",     label: "Event Verified",     color: "bg-green-500" },
                  { key: "rejected",           label: "Rejected",           color: "bg-red-400" },
                ].map(({ key, label, color }) => (
                  <BarRow
                    key={key}
                    label={label}
                    count={byVerification[key] ?? 0}
                    max={athleteCount || 1}
                    color={color}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── Public Profiles & Data Quality ─────────────────────────────── */}
      <section>
        <SectionTitle icon={<Globe className="w-5 h-5" />} title="Public Profiles & Data Quality" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Public Profile Metrics */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Public Profile Metrics</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                <BarRow label="Public & Active"       count={publicCount}                    max={athleteCount || 1} color="bg-green-500" />
                <BarRow label="Pending Approval"      count={byProfileStatus["pending"] ?? 0} max={athleteCount || 1} color="bg-yellow-400" />
                <BarRow label="Hidden / Rejected"     count={byProfileStatus["rejected"] ?? 0} max={athleteCount || 1} color="bg-red-400" />
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-lg font-bold text-green-600">{publicCount}</div>
                  <div className="text-gray-500">Public</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">{byProfileStatus["pending"] ?? 0}</div>
                  <div className="text-gray-500">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-500">{byProfileStatus["rejected"] ?? 0}</div>
                  <div className="text-gray-500">Rejected</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Data Quality */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Data Quality</h3>
                {(missingPhoto + pendingConsent + missingAchievement + missingClub) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Needs attention
                  </span>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: "Missing Profile Photo",     count: missingPhoto,       color: "bg-orange-400" },
                  { label: "Guardian Consent Pending",  count: pendingConsent,     color: "bg-red-400" },
                  { label: "No Achievement Summary",    count: missingAchievement, color: "bg-yellow-400" },
                  { label: "No Club / School",          count: missingClub,        color: "bg-gray-400" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{label}</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${count > 0 ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                      {count > 0 ? count : "✓ None"}
                    </span>
                  </div>
                ))}
              </div>
              {athleteCount > 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  Based on {athleteCount} active athlete{athleteCount !== 1 ? "s" : ""}
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ── Event Payment Analytics ─────────────────────────────────────── */}
      <section>
        <SectionTitle icon={<CreditCard className="w-5 h-5" />} title="Event Payment Analytics" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Confirmed Registrations"
            value={confirmedRegs}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Pending Payments"
            value={pendingPayments}
            icon={<CreditCard className="w-5 h-5 text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatCard
            label="Failed Payments"
            value={failedPayments}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            color="bg-red-50"
          />
          <StatCard
            label="Total Collected"
            value={totalCollected > 0 ? `₹${totalCollected.toLocaleString("en-IN")}` : "₹0"}
            icon={<CreditCard className="w-5 h-5 text-[#5B21B6]" />}
            color="bg-purple-50"
          />
        </div>
      </section>

      {/* ── Athlete Breakdowns ──────────────────────────────────────────── */}
      <section>
        <SectionTitle icon={<Users className="w-5 h-5" />} title="Athlete Breakdowns" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* By Sport */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Athletes by Sport</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {sortedSports.map(([sport, count]) => (
                  <BarRow key={sport} label={sport} count={count} max={athleteCount || 1} color="bg-[#5B21B6]" />
                ))}
                {!sortedSports.length && <p className="text-xs text-gray-400">No data yet</p>}
              </div>
            </CardBody>
          </Card>

          {/* By District */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Athletes by District</h3>
                <span className="text-xs text-gray-400">{districtCount} / {ODISHA_TOTAL_DISTRICTS} districts · top 10</span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {sortedDistricts.map(([district, count]) => (
                  <BarRow key={district} label={district} count={count} max={athleteCount || 1} color="bg-[#7C3AED]" />
                ))}
                {!sortedDistricts.length && <p className="text-xs text-gray-400">No data yet</p>}
              </div>
            </CardBody>
          </Card>

          {/* By Age Group */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Athletes by Age Group</h3></CardHeader>
            <CardBody>
              <div className="space-y-3">
                {sortedAgeGroups.map(([ag, count]) => (
                  <BarRow key={ag} label={ag} count={count} max={athleteCount || 1} color="bg-blue-500" />
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Gender Breakdown */}
          <Card>
            <CardHeader><h3 className="font-semibold text-gray-900">Gender Breakdown</h3></CardHeader>
            <CardBody>
              <div className="space-y-3 mb-4">
                {genderRows.map(({ key, label, color }) => (
                  <BarRow key={key} label={label} count={byGender[key] ?? 0} max={athleteCount || 1} color={color} />
                ))}
              </div>
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                {genderRows.map(({ key, label }) => {
                  const count = byGender[key] ?? 0;
                  const pct = athleteCount > 0 ? Math.round((count / athleteCount) * 100) : 0;
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl p-2.5 text-center">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500 leading-tight">{label}</div>
                      {athleteCount > 0 && <div className="text-xs text-gray-400">{pct}%</div>}
                    </div>
                  );
                })}
              </div>
              {!Object.keys(byGender).length && <p className="text-xs text-gray-400">No data yet</p>}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
