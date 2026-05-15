import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Clock,
  Search,
  Trophy,
  Mail,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export const metadata = { title: "Events | Juggernauts Athlete ID" };

interface SearchParams {
  q?: string;
  sport?: string;
  district?: string;
  age_category?: string;
  status?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

type DerivedStatus = "open" | "closing_soon" | "closed" | "full" | "completed";

interface EventRow {
  id: string;
  name: string;
  sport: string;
  venue: string;
  district: string;
  age_category: string;
  registration_fee: number;
  event_date: string;
  registration_deadline: string;
  max_participants: number | null;
  description: string | null;
  status: string;
}

function getDerivedStatus(event: EventRow, regCount: number): DerivedStatus {
  if (event.status === "completed") return "completed";
  if (event.status === "closed") return "closed";
  if (event.status === "open") {
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    if (deadline < now) return "closed";
    if (event.max_participants && regCount >= event.max_participants) return "full";
    if (differenceInDays(deadline, now) <= 3) return "closing_soon";
    return "open";
  }
  return "closed";
}

const DERIVED_STATUS_UI: Record<DerivedStatus, { label: string; color: string }> = {
  open: { label: "Open for Registration", color: "bg-green-100 text-green-800" },
  closing_soon: { label: "Closing Soon", color: "bg-orange-100 text-orange-800" },
  closed: { label: "Registration Closed", color: "bg-gray-100 text-gray-600" },
  full: { label: "Full", color: "bg-red-100 text-red-700" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800" },
};

function buildHref(current: SearchParams, override: Partial<SearchParams>): string {
  const merged = { ...current, ...override };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v as string);
  }
  const qs = params.toString();
  return `/events${qs ? `?${qs}` : ""}`;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    navUser = { email: user.email, role: profile?.role };
  }

  // Build base query (exclude drafts)
  let query = supabase
    .from("events")
    .select("id, name, sport, venue, district, age_category, registration_fee, event_date, registration_deadline, max_participants, description, status")
    .in("status", ["open", "closed", "completed"])
    .order("event_date", { ascending: true });

  // Text search
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  // Filter by sport
  if (sp.sport) query = query.eq("sport", sp.sport);

  // Filter by district
  if (sp.district) query = query.eq("district", sp.district);

  // Filter by age category
  if (sp.age_category) query = query.eq("age_category", sp.age_category);

  // Filter by DB status (derived status filtering happens client-side below)
  if (sp.status === "completed") {
    query = query.eq("status", "completed");
  } else if (sp.status === "closed") {
    query = query.in("status", ["closed", "open"]);
  } else if (sp.status === "open" || sp.status === "closing_soon" || sp.status === "full") {
    query = query.eq("status", "open");
  }

  const [{ data: rawEvents }, { data: allRegs }] = await Promise.all([
    query,
    supabase.from("event_registrations").select("event_id"),
  ]);

  // Build registration count map
  const regCountMap: Record<string, number> = {};
  for (const r of allRegs ?? []) {
    regCountMap[r.event_id] = (regCountMap[r.event_id] ?? 0) + 1;
  }

  // Annotate with derived status and filter
  const events = (rawEvents ?? [])
    .map((e) => ({
      ...e,
      regCount: regCountMap[e.id] ?? 0,
      derivedStatus: getDerivedStatus(e as EventRow, regCountMap[e.id] ?? 0),
    }))
    .filter((e) => {
      if (!sp.status) return true;
      if (sp.status === "open") return e.derivedStatus === "open";
      if (sp.status === "closing_soon") return e.derivedStatus === "closing_soon";
      if (sp.status === "full") return e.derivedStatus === "full";
      if (sp.status === "closed") return e.derivedStatus === "closed";
      if (sp.status === "completed") return e.derivedStatus === "completed";
      return true;
    });

  // Fetch filter options from all (unfiltered) events
  const { data: allEventsForFilters } = await supabase
    .from("events")
    .select("sport, district, age_category")
    .in("status", ["open", "closed", "completed"]);

  const sports = [...new Set(allEventsForFilters?.map((e) => e.sport) ?? [])].sort();
  const districts = [...new Set(allEventsForFilters?.map((e) => e.district) ?? [])].sort();
  const ageCategories = [...new Set(allEventsForFilters?.map((e) => e.age_category) ?? [])].sort();

  const openOrSoon = events.filter((e) => e.derivedStatus === "open" || e.derivedStatus === "closing_soon" || e.derivedStatus === "full");
  const past = events.filter((e) => e.derivedStatus === "closed" || e.derivedStatus === "completed");
  const hasFilters = !!(sp.q || sp.sport || sp.district || sp.age_category || sp.status);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={navUser} />

      <main className="flex-1">
        {/* Hero */}
        <div
          className="py-14 px-4"
          style={{ background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 100%)" }}
        >
          <div className="max-w-4xl mx-auto text-center text-white">
            <Calendar className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Events & Tournaments</h1>
            <p className="text-purple-200 mb-6">
              Register for upcoming grassroots sports events in Odisha
            </p>

            {/* Search bar */}
            <form action="/events" method="GET" className="max-w-lg mx-auto">
              {/* Preserve existing filters */}
              {sp.sport && <input type="hidden" name="sport" value={sp.sport} />}
              {sp.district && <input type="hidden" name="district" value={sp.district} />}
              {sp.age_category && <input type="hidden" name="age_category" value={sp.age_category} />}
              {sp.status && <input type="hidden" name="status" value={sp.status} />}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={sp.q ?? ""}
                  placeholder="Search events by name, sport, district, or venue"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="space-y-2 mb-8">
            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All Events", value: "" },
                { label: "Open", value: "open" },
                { label: "Closing Soon", value: "closing_soon" },
                { label: "Full", value: "full" },
                { label: "Closed", value: "closed" },
                { label: "Completed", value: "completed" },
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

            {/* Sport filter */}
            {sports.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 font-medium w-12">Sport</span>
                {sports.map((sport) => (
                  <Link
                    key={sport}
                    href={buildHref(sp, { sport: sp.sport === sport ? undefined : sport })}
                    className={[
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      sp.sport === sport
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100",
                    ].join(" ")}
                  >
                    {sport}
                  </Link>
                ))}
              </div>
            )}

            {/* District filter */}
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

            {/* Age Category filter */}
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

          {/* Active / upcoming events */}
          {!hasFilters || sp.status !== "completed" ? (
            <section className="mb-10">
              {!sp.status && (
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Open for Registration
                </h2>
              )}
              {openOrSoon.length > 0 ? (
                <div className="grid gap-4">
                  {openOrSoon.map((e) => (
                    <EventCard key={e.id} event={e} regCount={e.regCount} derivedStatus={e.derivedStatus} />
                  ))}
                </div>
              ) : !sp.status || sp.status === "open" || sp.status === "closing_soon" || sp.status === "full" ? (
                <EmptyState />
              ) : null}
            </section>
          ) : null}

          {/* Past events */}
          {past.length > 0 && (
            <section className="mb-10">
              {!hasFilters && (
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Events</h2>
              )}
              <div className="grid gap-4">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} regCount={e.regCount} derivedStatus={e.derivedStatus} />
                ))}
              </div>
            </section>
          )}

          {/* No results for filtered view */}
          {hasFilters && events.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No events match your filters</p>
              <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
              <Link
                href="/events"
                className="text-sm text-[#5B21B6] hover:underline font-medium"
              >
                Clear all filters
              </Link>
            </div>
          )}

          {/* Organiser CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 p-8 text-center">
            <Trophy className="w-8 h-8 text-[#5B21B6] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Want to host a grassroots event?
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Partner with Juggernauts to organise officially recognised sports events in your district. We handle athlete IDs, registration, and verification.
            </p>
            <a
              href="mailto:events@juggernauts.in"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B21B6] text-white text-sm font-semibold hover:bg-[#4C1D95] transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact us about hosting
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
      <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-600 font-medium mb-1">No events open right now</p>
      <p className="text-gray-400 text-sm mb-6">Check back soon or get your Athlete ID ready for when events open.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/athlete/register"
          className="px-5 py-2.5 rounded-xl bg-[#5B21B6] text-white text-sm font-semibold hover:bg-[#4C1D95] transition-colors"
        >
          Create Athlete ID
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function EventCard({
  event,
  regCount,
  derivedStatus,
}: {
  event: EventRow;
  regCount: number;
  derivedStatus: DerivedStatus;
}) {
  const statusUi = DERIVED_STATUS_UI[derivedStatus];
  const spotsLeft = event.max_participants ? event.max_participants - regCount : null;
  const canRegister = derivedStatus === "open" || derivedStatus === "closing_soon";
  const deadline = new Date(event.registration_deadline);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusUi.color}`}>
                {statusUi.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                {event.sport}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {event.age_category}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{event.name}</h3>

            {event.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {format(new Date(event.event_date), "dd MMM yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {event.venue}, {event.district}
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                {event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free"}
              </span>
              {canRegister && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Closes {format(deadline, "dd MMM")}
                </span>
              )}
              {event.max_participants && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {regCount} / {event.max_participants}
                  {spotsLeft !== null && canRegister && (
                    <span className={`font-semibold ${spotsLeft <= 5 ? "text-orange-600" : "text-gray-700"}`}>
                      ({spotsLeft} left)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-row sm:flex-col gap-2">
            {canRegister ? (
              <Link
                href={`/events/${event.id}`}
                className="px-5 py-2.5 rounded-xl bg-[#5B21B6] text-white text-sm font-semibold hover:bg-[#4C1D95] transition-colors text-center"
              >
                Register Now
              </Link>
            ) : (
              <Link
                href={`/events/${event.id}`}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors text-center"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
