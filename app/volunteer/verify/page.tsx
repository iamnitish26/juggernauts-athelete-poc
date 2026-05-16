import { createClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface SearchParams {
  q?: string;
  district?: string;
  sport?: string;
  status?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = { title: "Verify Athletes | Volunteer" };

export default async function VolunteerVerifyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("athletes")
    .select("id, athlete_id, full_name, primary_sport, district, age_group, verification_status, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(50);

  if (sp.status) {
    query = query.eq("verification_status", sp.status);
  } else {
    query = query.eq("verification_status", "self_registered");
  }

  if (sp.q) query = query.or(`full_name.ilike.%${sp.q}%,athlete_id.ilike.%${sp.q}%`);
  if (sp.district) query = query.eq("district", sp.district);
  if (sp.sport) query = query.eq("primary_sport", sp.sport);

  const { data: athletes } = await query;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verify Athletes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search and verify athlete profiles
        </p>
      </div>

      {/* Search form */}
      <form className="space-y-2 mb-6" method="get">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name or Athlete ID..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
        />
        <div className="flex gap-2">
          <input
            name="district"
            defaultValue={sp.district}
            placeholder="District..."
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <input
            name="sport"
            defaultValue={sp.sport}
            placeholder="Sport..."
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#5B21B6] text-white text-sm font-semibold hover:bg-[#4C1D95] transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <Card>
        <div className="divide-y divide-gray-50">
          {athletes?.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{a.full_name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {a.primary_sport} · {a.district} · {a.age_group}
                </p>
                <p className="font-mono text-xs text-[#7C3AED] mt-0.5 truncate">{a.athlete_id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <VerificationBadge status={a.verification_status} />
                <Link
                  href={`/volunteer/verify/${a.id}`}
                  className="text-xs bg-[#5B21B6] text-white px-3 py-1.5 rounded-lg hover:bg-[#4C1D95] transition-colors font-medium"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
          {!athletes?.length && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              No athletes found matching your search
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
