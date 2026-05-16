import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import Button from "@/components/ui/Button";
import AdminEventActions from "@/components/dashboard/AdminEventActions";
import { format, differenceInDays } from "date-fns";
import { Plus, Search, Calendar, MapPin, Users, IndianRupee } from "lucide-react";

export const metadata = { title: "Events | Admin" };

interface SearchParams {
  q?: string;
  sport?: string;
  district?: string;
  status?: string;
  age_category?: string;
  paid?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

type DerivedStatus =
  | "draft"
  | "open"
  | "closing_soon"
  | "full"
  | "closed"
  | "completed";

const DERIVED_STATUS_UI: Record<DerivedStatus, { label: string; color: string }> = {
  draft:        { label: "Draft",                 color: "bg-yellow-100 text-yellow-800" },
  open:         { label: "Open for Registration", color: "bg-green-100 text-green-800" },
  closing_soon: { label: "Closing Soon",          color: "bg-orange-100 text-orange-800" },
  full:         { label: "Full",                  color: "bg-red-100 text-red-700" },
  closed:       { label: "Registration Closed",   color: "bg-gray-100 text-gray-600" },
  completed:    { label: "Completed",             color: "bg-blue-100 text-blue-800" },
};

function getDerivedStatus(
  status: string,
  deadline: string,
  regCount: number,
  maxParticipants: number | null
): DerivedStatus {
  if (status === "draft") return "draft";
  if (status === "completed") return "completed";
  if (status === "closed") return "closed";
  if (status === "open") {
    const dl = new Date(deadline);
    const now = new Date();
    if (dl < now) return "closed";
    if (maxParticipants && regCount >= maxParticipants) return "full";
    if (differenceInDays(dl, now) <= 3) return "closing_soon";
    return "open";
  }
  return "closed";
}

function buildHref(current: SearchParams, override: Partial<SearchParams>): string {
  const merged = { ...current, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v as string);
  }
  const qs = params.toString();
  return `/admin/events${qs ? `?${qs}` : ""}`;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select(
      "id, name, sport, age_category, event_date, registration_deadline, venue, district, registration_fee, max_participants, status, event_type"
    )
    .order("event_date", { ascending: false });

  if (sp.q)            query = query.or(`name.ilike.%${sp.q}%,sport.ilike.%${sp.q}%,district.ilike.%${sp.q}%,venue.ilike.%${sp.q}%`);
  if (sp.sport)        query = query.eq("sport", sp.sport);
  if (sp.district)     query = query.eq("district", sp.district);
  if (sp.age_category) query = query.eq("age_category", sp.age_category);
  if (sp.status)       query = query.eq("status", sp.status);
  if (sp.paid === "paid") query = query.gt("registration_fee", 0);
  if (sp.paid === "free") query = query.eq("registration_fee", 0);

  const [{ data: events }, { data: regRows }] = await Promise.all([
    query,
    supabase
      .from("event_registrations")
      .select("event_id, registration_status, payment_status, amount"),
  ]);

  // Build per-event summaries
  type RegSummary = {
    total: number;
    confirmed: number;
    paid: number;
    pending: number;
    failed: number;
    totalCollected: number;
  };
  const regSummary: Record<string, RegSummary> = {};
  for (const r of regRows ?? []) {
    if (!regSummary[r.event_id]) {
      regSummary[r.event_id] = { total: 0, confirmed: 0, paid: 0, pending: 0, failed: 0, totalCollected: 0 };
    }
    const s = regSummary[r.event_id];
    s.total++;
    if (r.registration_status === "confirmed") s.confirmed++;
    if (r.payment_status === "paid") { s.paid++; s.totalCollected += Number(r.amount) || 0; }
    if (r.payment_status === "pending") s.pending++;
    if (r.payment_status === "failed")  s.failed++;
  }

  // Annotate events with derived status
  const annotated = (events ?? []).map((e) => {
    const sum = regSummary[e.id] ?? { total: 0, confirmed: 0, paid: 0, pending: 0, failed: 0, totalCollected: 0 };
    return {
      ...e,
      sum,
      derivedStatus: getDerivedStatus(e.status, e.registration_deadline, sum.total, e.max_participants),
    };
  });

  // Filter options (from all events before text/status filters)
  const { data: allEventsForFilters } = await supabase
    .from("events")
    .select("sport, district, age_category");
  const sports        = [...new Set(allEventsForFilters?.map((e) => e.sport) ?? [])].sort();
  const districts     = [...new Set(allEventsForFilters?.map((e) => e.district) ?? [])].sort();
  const ageCategories = [...new Set(allEventsForFilters?.map((e) => e.age_category) ?? [])].sort();

  const hasFilters = !!(sp.q || sp.sport || sp.district || sp.age_category || sp.status || sp.paid);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{annotated.length} event{annotated.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/events/new" className="shrink-0">
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Event</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form action="/admin/events" method="GET" className="mb-4">
        {sp.sport        && <input type="hidden" name="sport"        value={sp.sport} />}
        {sp.district     && <input type="hidden" name="district"     value={sp.district} />}
        {sp.age_category && <input type="hidden" name="age_category" value={sp.age_category} />}
        {sp.status       && <input type="hidden" name="status"       value={sp.status} />}
        {sp.paid         && <input type="hidden" name="paid"         value={sp.paid} />}
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search events by name, sport, district, or venue"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        {/* Status */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "All",               value: "" },
            { label: "Draft",             value: "draft" },
            { label: "Open",              value: "open" },
            { label: "Closed",            value: "closed" },
            { label: "Completed",         value: "completed" },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { status: value || undefined })}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                (sp.status === value || (!sp.status && !value))
                  ? "bg-[#5B21B6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Paid/Free */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium w-12">Fee</span>
          {[
            { label: "All", value: "" },
            { label: "Paid", value: "paid" },
            { label: "Free", value: "free" },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={buildHref(sp, { paid: value || undefined })}
              className={[
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                (sp.paid === value || (!sp.paid && !value))
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Sport */}
        {sports.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium w-12">Sport</span>
            {sports.map((s) => (
              <Link
                key={s}
                href={buildHref(sp, { sport: sp.sport === s ? undefined : s })}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  sp.sport === s
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100",
                ].join(" ")}
              >
                {s}
              </Link>
            ))}
          </div>
        )}

        {/* District */}
        {districts.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium w-12">District</span>
            {districts.map((d) => (
              <Link
                key={d}
                href={buildHref(sp, { district: sp.district === d ? undefined : d })}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  sp.district === d
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                ].join(" ")}
              >
                {d}
              </Link>
            ))}
          </div>
        )}

        {/* Age Category */}
        {ageCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium w-12">Age</span>
            {ageCategories.map((cat) => (
              <Link
                key={cat}
                href={buildHref(sp, { age_category: sp.age_category === cat ? undefined : cat })}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  sp.age_category === cat
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100",
                ].join(" ")}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {annotated.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          {hasFilters ? (
            <>
              <p className="text-gray-500 font-medium mb-1">No events match your filters</p>
              <Link href="/admin/events" className="text-sm text-[#5B21B6] hover:underline">Clear filters</Link>
            </>
          ) : (
            <>
              <p className="text-gray-700 font-semibold mb-2">No events created yet</p>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first event to start accepting athlete registrations.
              </p>
              <Link href="/admin/events/new">
                <Button size="sm" className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Event
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Desktop table */}
      {annotated.length > 0 && (
        <>
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Event", "Sport / Age", "Date / Deadline", "Location",
                      "Fee", "Registrations", "Payment Summary", "Status", "",
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
                  {annotated.map((event) => {
                    const statusUi = DERIVED_STATUS_UI[event.derivedStatus];
                    return (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="font-semibold text-gray-900 truncate">{event.name}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-700">{event.sport}</p>
                          <p className="text-xs text-gray-400">{event.age_category}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-700">{format(new Date(event.event_date), "dd MMM yyyy")}</p>
                          <p className="text-xs text-gray-400">
                            Deadline: {format(new Date(event.registration_deadline), "dd MMM")}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-700 truncate max-w-[120px]">{event.venue}</p>
                          <p className="text-xs text-gray-400">{event.district}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {event.registration_fee > 0
                            ? <span className="text-gray-700">₹{event.registration_fee}</span>
                            : <span className="text-gray-400 text-xs">Free</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-gray-700 font-medium">
                            {event.sum.total}{event.max_participants ? ` / ${event.max_participants}` : ""}
                          </p>
                          <p className="text-xs text-gray-400">{event.sum.confirmed} confirmed</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {event.registration_fee > 0 ? (
                            <div className="text-xs space-y-0.5">
                              <p className="text-green-700">{event.sum.paid} paid</p>
                              {event.sum.pending > 0 && <p className="text-yellow-700">{event.sum.pending} pending</p>}
                              {event.sum.failed  > 0 && <p className="text-red-600">{event.sum.failed} failed</p>}
                              {event.sum.totalCollected > 0 && (
                                <p className="font-semibold text-gray-900">
                                  ₹{event.sum.totalCollected.toLocaleString("en-IN")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusUi.color}`}>
                            {statusUi.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AdminEventActions
                            event={{ id: event.id, name: event.name, status: event.status }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {annotated.map((event) => {
              const statusUi = DERIVED_STATUS_UI[event.derivedStatus];
              return (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusUi.color}`}>
                          {statusUi.label}
                        </span>
                        <span className="text-xs text-gray-500">{event.sport} · {event.age_category}</span>
                      </div>
                      <p className="font-semibold text-gray-900 mb-2">{event.name}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(event.event_date), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.sum.total}{event.max_participants ? `/${event.max_participants}` : ""} registered
                        </span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free"}
                        </span>
                      </div>
                      {event.registration_fee > 0 && event.sum.totalCollected > 0 && (
                        <p className="mt-1 text-xs font-semibold text-green-700">
                          ₹{event.sum.totalCollected.toLocaleString("en-IN")} collected
                        </p>
                      )}
                    </div>
                    <AdminEventActions
                      event={{ id: event.id, name: event.name, status: event.status }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
