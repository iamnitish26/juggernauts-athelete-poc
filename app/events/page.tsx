import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { Calendar, MapPin, Users, Trophy, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Events | Juggernauts Athlete ID" };

const EVENT_STATUS_STYLES: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-800",
  draft: "bg-yellow-100 text-yellow-800",
};

export default async function EventsPage() {
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

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("status", ["open", "closed", "completed"])
    .order("event_date", { ascending: true });

  const openEvents = events?.filter((e) => e.status === "open") ?? [];
  const pastEvents = events?.filter((e) => e.status !== "open") ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={navUser} />

      <main className="flex-1">
        {/* Hero */}
        <div
          className="py-14 px-4"
          style={{
            background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 100%)",
          }}
        >
          <div className="max-w-4xl mx-auto text-center text-white">
            <Calendar className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Events & Tournaments</h1>
            <p className="text-purple-200">
              Register for upcoming grassroots sports events in Odisha
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Open events */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Open for Registration
            </h2>
            {openEvents.length ? (
              <div className="grid gap-4">
                {openEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No events open for registration yet.</p>
                <p className="text-gray-400 text-xs mt-1">Check back soon!</p>
              </div>
            )}
          </section>

          {/* Past events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Past Events</h2>
              <div className="grid gap-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event }: { event: Record<string, unknown> }) {
  const id = event.id as string;
  const name = event.name as string;
  const sport = event.sport as string;
  const venue = event.venue as string;
  const district = event.district as string;
  const age_category = event.age_category as string;
  const registration_fee = event.registration_fee as number;
  const event_date = event.event_date as string;
  const status = event.status as string;
  const max_participants = event.max_participants as number | null;
  const description = event.description as string | null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                color={EVENT_STATUS_STYLES[status]}
              />
              <Badge label={sport} color="bg-purple-100 text-purple-800" />
              <Badge label={age_category} color="bg-blue-100 text-blue-800" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{name}</h3>
            {description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(event_date), "dd MMM yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {venue}, {district}
              </span>
              {max_participants && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Max {max_participants}
                </span>
              )}
              <span className="flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5" />
                {registration_fee > 0 ? `₹${registration_fee}` : "Free"}
              </span>
            </div>
          </div>
          {status === "open" && (
            <Link
              href={`/events/${id}`}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-[#5B21B6] text-white text-sm font-semibold hover:bg-[#4C1D95] transition-colors text-center"
            >
              Register Now
            </Link>
          )}
          {status !== "open" && (
            <Link
              href={`/events/${id}`}
              className="shrink-0 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            >
              View Details
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
