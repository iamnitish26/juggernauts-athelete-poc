import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import EventRegisterButton from "@/components/forms/EventRegisterButton";
import { Calendar, MapPin, Users, IndianRupee, Clock, Trophy } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .in("status", ["open", "closed", "completed"])
    .single();

  if (error || !event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser = null;
  let athleteProfile = null;
  let alreadyRegistered = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    navUser = { email: user.email, role: profile?.role };

    const { data: athlete } = await supabase
      .from("athletes")
      .select("id, athlete_id, full_name, verification_status")
      .eq("user_id", user.id)
      .single();
    athleteProfile = athlete;

    if (athlete) {
      const { data: reg } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("athlete_profile_id", athlete.id)
        .single();
      alreadyRegistered = !!reg;
    }
  }

  const { count: registrationCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const spotsLeft =
    event.max_participants && registrationCount !== null
      ? event.max_participants - registrationCount
      : null;

  const isOpen = event.status === "open";
  const deadlinePassed = new Date(event.registration_deadline) < new Date();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={navUser} />

      <main className="flex-1">
        <div
          className="py-14 px-4"
          style={{
            background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto text-white">
            <Link
              href="/events"
              className="text-purple-300 text-sm hover:text-white mb-4 block"
            >
              ← Back to Events
            </Link>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge label={event.sport} color="bg-white/20 text-white" />
              <Badge label={event.age_category} color="bg-white/20 text-white" />
              <Badge
                label={isOpen ? "Open" : event.status}
                color={isOpen ? "bg-green-400 text-green-900" : "bg-gray-200 text-gray-700"}
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-purple-200 text-sm mt-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.event_date), "EEEE, dd MMMM yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.venue}, {event.district}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {event.description && (
                <Card>
                  <CardBody>
                    <h2 className="font-semibold text-gray-900 mb-2">About this Event</h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardBody>
                  <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Sport", value: event.sport, icon: <Trophy className="w-4 h-4 text-[#5B21B6]" /> },
                      { label: "Age Category", value: event.age_category, icon: <Users className="w-4 h-4 text-[#5B21B6]" /> },
                      { label: "Registration Fee", value: event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free", icon: <IndianRupee className="w-4 h-4 text-[#5B21B6]" /> },
                      { label: "Registration Deadline", value: format(new Date(event.registration_deadline), "dd MMM yyyy"), icon: <Clock className="w-4 h-4 text-[#5B21B6]" /> },
                      { label: "Max Participants", value: event.max_participants ? String(event.max_participants) : "Unlimited", icon: <Users className="w-4 h-4 text-[#5B21B6]" /> },
                      { label: "Spots Left", value: spotsLeft !== null ? String(spotsLeft) : "Open", icon: <Users className="w-4 h-4 text-[#5B21B6]" /> },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          {icon}
                          {label}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{value}</div>
                      </div>
                    ))}
                  </dl>
                </CardBody>
              </Card>
            </div>

            {/* Registration sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardBody>
                  <h2 className="font-semibold text-gray-900 mb-4">Register</h2>

                  {alreadyRegistered && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ You&apos;re registered for this event!
                      </p>
                    </div>
                  )}

                  {!isOpen && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        {event.status === "completed"
                          ? "This event has completed."
                          : "Registrations are closed."}
                      </p>
                    </div>
                  )}

                  {deadlinePassed && isOpen && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        Registration deadline has passed.
                      </p>
                    </div>
                  )}

                  {isOpen && !deadlinePassed && !alreadyRegistered && (
                    <EventRegisterButton
                      eventId={id}
                      eventName={event.name}
                      registrationFee={event.registration_fee}
                      user={user ? { id: user.id } : null}
                      athleteProfile={athleteProfile}
                    />
                  )}

                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                      Registered: {registrationCount ?? 0}
                      {event.max_participants && ` / ${event.max_participants}`}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
