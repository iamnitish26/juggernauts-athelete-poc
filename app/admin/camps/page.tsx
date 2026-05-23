import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Tent, MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import {
  CAMP_STATUS_LABELS,
  CAMP_STATUS_COLORS,
  ODISHA_DISTRICTS,
} from "@/lib/constants";

export const metadata = { title: "Camps | Admin" };

interface SearchParams {
  q?: string;
  status?: string;
  district?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function buildHref(current: SearchParams, override: Partial<SearchParams>): string {
  const merged = { ...current, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v as string);
  }
  const qs = params.toString();
  return `/admin/camps${qs ? `?${qs}` : ""}`;
}

export default async function AdminCampsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("camps")
    .select("id, name, sport, district, venue, camp_date, status, age_groups")
    .order("camp_date", { ascending: false });

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.district) query = query.eq("district", sp.district);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  const { data: camps } = await query;

  // Participant summary per camp
  const campIds = (camps ?? []).map((c) => c.id);
  const participantCounts: Record<string, { total: number; verified: number; recommended: number }> = {};

  if (campIds.length > 0) {
    const { data: participants } = await supabase
      .from("camp_participants")
      .select("camp_id, camp_verification_status, recommendation_category")
      .in("camp_id", campIds);

    for (const p of participants ?? []) {
      if (!participantCounts[p.camp_id]) {
        participantCounts[p.camp_id] = { total: 0, verified: 0, recommended: 0 };
      }
      participantCounts[p.camp_id].total++;
      if (p.camp_verification_status === "camp_verified") participantCounts[p.camp_id].verified++;
      if (p.recommendation_category === "JSF Recommended") participantCounts[p.camp_id].recommended++;
    }
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Camps</h1>
          <p className="text-sm text-gray-500 mt-0.5">Football assessment camps and JSF Camp Verified results</p>
        </div>
        <Link href="/admin/camps/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            New Camp
          </Button>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["", "draft", "open", "completed", "cancelled"] as const).map((s) => (
          <Link
            key={s || "all"}
            href={buildHref(sp, { status: s || undefined })}
            className={[
              "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
              (sp.status ?? "") === s
                ? "bg-[#5B21B6] text-white"
                : "bg-[#F3E8FF] text-[#5B21B6] hover:bg-purple-100",
            ].join(" ")}
          >
            {s ? (CAMP_STATUS_LABELS[s] ?? s) : "All"}
          </Link>
        ))}
      </div>

      {camps && camps.length > 0 ? (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-4 py-3 font-semibold text-gray-600">Camp</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">District / Venue</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Age Groups</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Participants</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(camps ?? []).map((camp) => {
                  const counts = participantCounts[camp.id] ?? { total: 0, verified: 0, recommended: 0 };
                  const statusColor = CAMP_STATUS_COLORS[camp.status] ?? "bg-gray-100 text-gray-600";
                  const statusLabel = CAMP_STATUS_LABELS[camp.status] ?? camp.status;
                  return (
                    <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{camp.name}</p>
                        <p className="text-xs text-gray-500">{camp.sport}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{camp.district}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{camp.venue}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {format(new Date(camp.camp_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(camp.age_groups ?? []).map((ag: string) => (
                            <span key={ag} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                              {ag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{counts.total}</p>
                        <p className="text-xs text-gray-400">
                          {counts.verified} verified · {counts.recommended} rec.
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/camps/${camp.id}`}>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(camps ?? []).map((camp) => {
              const counts = participantCounts[camp.id] ?? { total: 0, verified: 0, recommended: 0 };
              const statusColor = CAMP_STATUS_COLORS[camp.status] ?? "bg-gray-100 text-gray-600";
              const statusLabel = CAMP_STATUS_LABELS[camp.status] ?? camp.status;
              return (
                <Link key={camp.id} href={`/admin/camps/${camp.id}`}>
                  <Card className="p-4 hover:border-purple-200 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{camp.name}</p>
                        <p className="text-xs text-gray-500">{camp.sport}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {camp.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(camp.camp_date), "dd MMM yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {counts.total} participants · {counts.verified} verified
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Tent className="w-12 h-12" />}
          title="No camps yet"
          description="Create the first JSF football assessment camp to get started."
          action={
            <Link href="/admin/camps/new">
              <Button>
                <Plus className="w-4 h-4" />
                New Camp
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
