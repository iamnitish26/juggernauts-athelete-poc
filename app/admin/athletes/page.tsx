import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Search } from "lucide-react";

interface SearchParams {
  status?: string;
  sport?: string;
  district?: string;
  q?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = { title: "Athletes | Admin" };

export default async function AdminAthletesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select(
      "id, athlete_id, full_name, primary_sport, district, age_group, verification_status, created_at, gender"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (sp.status) query = query.eq("verification_status", sp.status);
  if (sp.sport) query = query.eq("primary_sport", sp.sport);
  if (sp.district) query = query.eq("district", sp.district);
  if (sp.q) query = query.ilike("full_name", `%${sp.q}%`);

  const { data: athletes } = await query;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {athletes?.length ?? 0} athletes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "All", status: "" },
          { label: "Pending", status: "self_registered" },
          { label: "Community Verified", status: "community_verified" },
          { label: "Event Verified", status: "event_verified" },
          { label: "Rejected", status: "rejected" },
        ].map(({ label, status }) => (
          <Link
            key={label}
            href={status ? `/admin/athletes?status=${status}` : "/admin/athletes"}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              sp.status === status || (!sp.status && !status)
                ? "bg-[#5B21B6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Athlete
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Athlete ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Sport
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  District
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {athletes?.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        {athlete.full_name}
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
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {athlete.primary_sport}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {athlete.district}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={athlete.verification_status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/athletes/${athlete.id}`}
                        className="text-xs text-[#5B21B6] hover:underline font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/athlete/${athlete.athlete_id}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:underline"
                      >
                        Profile
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!athletes?.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400 text-sm"
                  >
                    No athletes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
