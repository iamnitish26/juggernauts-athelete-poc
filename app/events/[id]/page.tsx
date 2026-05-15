import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import EventRegisterButton from "@/components/forms/EventRegisterButton";
import EventShareButton from "@/components/ui/EventShareButton";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Clock,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Info,
  Mail,
  Phone,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface PageProps {
  params: Promise<{ id: string }>;
}

function isMinorCategory(ageCategory: string): boolean {
  return /u[-\s]?1[0-8]|under[-\s]?1[0-8]/i.test(ageCategory);
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
  let existingRegistration = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    navUser = { email: user.email, role: profile?.role };

    const { data: athlete } = await supabase
      .from("athletes")
      .select("id, athlete_id, full_name, verification_status, age_group")
      .eq("user_id", user.id)
      .single();
    athleteProfile = athlete;

    if (athlete) {
      const { data: reg } = await supabase
        .from("event_registrations")
        .select("id, registration_status, payment_status, registered_at")
        .eq("event_id", id)
        .eq("athlete_profile_id", athlete.id)
        .single();
      existingRegistration = reg ?? null;
    }
  }

  const { count: registrationCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  const regCount = registrationCount ?? 0;
  const spotsLeft = event.max_participants ? event.max_participants - regCount : null;

  const now = new Date();
  const deadline = new Date(event.registration_deadline);
  const deadlinePassed = deadline < now;
  const daysToDeadline = differenceInDays(deadline, now);
  const isFull = event.max_participants ? regCount >= event.max_participants : false;
  const isOpen = event.status === "open" && !deadlinePassed && !isFull;
  const isClosingSoon = event.status === "open" && !deadlinePassed && !isFull && daysToDeadline <= 3;

  const requiresGuardianConsent = isMinorCategory(event.age_category);
  const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/events/${id}`;

  // Derive status label
  let statusLabel = "Open for Registration";
  let statusColor = "bg-green-400 text-green-900";
  if (event.status === "completed") { statusLabel = "Completed"; statusColor = "bg-blue-200 text-blue-900"; }
  else if (event.status === "closed") { statusLabel = "Registration Closed"; statusColor = "bg-gray-200 text-gray-700"; }
  else if (deadlinePassed) { statusLabel = "Registration Closed"; statusColor = "bg-gray-200 text-gray-700"; }
  else if (isFull) { statusLabel = "Full"; statusColor = "bg-red-200 text-red-800"; }
  else if (isClosingSoon) { statusLabel = "Closing Soon"; statusColor = "bg-orange-200 text-orange-900"; }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={navUser} />

      <main className="flex-1">
        {/* Hero */}
        <div
          className="py-14 px-4"
          style={{ background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 100%)" }}
        >
          <div className="max-w-3xl mx-auto text-white">
            <Link href="/events" className="text-purple-300 text-sm hover:text-white mb-4 block">
              ← Back to Events
            </Link>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {event.sport}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {event.age_category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-purple-200 text-sm mt-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.event_date), "EEEE, dd MMMM yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.venue}, {event.district}
              </span>
            </div>
            <div className="mt-4">
              <EventShareButton eventName={event.name} url={eventUrl} />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content */}
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

              {/* Event details grid */}
              <Card>
                <CardBody>
                  <h2 className="font-semibold text-gray-900 mb-4">Event Details</h2>
                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Sport",
                        value: event.sport,
                        icon: <Trophy className="w-4 h-4 text-[#5B21B6]" />,
                      },
                      {
                        label: "Age Category",
                        value: event.age_category,
                        icon: <Users className="w-4 h-4 text-[#5B21B6]" />,
                      },
                      {
                        label: "Registration Fee",
                        value: event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free",
                        icon: <IndianRupee className="w-4 h-4 text-[#5B21B6]" />,
                      },
                      {
                        label: deadlinePassed ? "Registration closed on" : "Register by",
                        value: format(deadline, "dd MMM yyyy"),
                        icon: <Clock className="w-4 h-4 text-[#5B21B6]" />,
                        highlight: isClosingSoon ? "text-orange-600 font-bold" : undefined,
                      },
                      {
                        label: "Registered",
                        value: `${regCount}${event.max_participants ? ` / ${event.max_participants}` : ""}`,
                        icon: <Users className="w-4 h-4 text-[#5B21B6]" />,
                      },
                      {
                        label: "Spots Left",
                        value: spotsLeft !== null ? (spotsLeft === 0 ? "Full" : String(spotsLeft)) : "Open",
                        icon: <Users className="w-4 h-4 text-[#5B21B6]" />,
                        highlight: spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0 ? "text-orange-600 font-bold" : undefined,
                      },
                    ].map(({ label, value, icon, highlight }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          {icon}
                          {label}
                        </div>
                        <div className={`font-semibold text-gray-900 text-sm ${highlight ?? ""}`}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </dl>

                  {isClosingSoon && (
                    <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                      <p className="text-xs text-orange-800">
                        Only {daysToDeadline} day{daysToDeadline !== 1 ? "s" : ""} left to register!
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Eligibility */}
              <Card>
                <CardBody>
                  <h2 className="font-semibold text-gray-900 mb-3">Eligibility</h2>
                  <ul className="space-y-2">
                    {[
                      { text: `Primary sport: ${event.sport}`, ok: true },
                      { text: `Age category: ${event.age_category}`, ok: true },
                      { text: "Valid Juggernauts Athlete ID required", ok: true },
                      ...(requiresGuardianConsent
                        ? [{ text: "Guardian consent required (for under-18 athletes)", ok: true }]
                        : []),
                    ].map(({ text }) => (
                      <li key={text} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {text}
                      </li>
                    ))}
                  </ul>
                  {!user && (
                    <p className="mt-3 text-xs text-gray-500">
                      <Link href="/athlete/register" className="text-[#5B21B6] hover:underline font-medium">
                        Create your Athlete ID
                      </Link>{" "}
                      to be eligible.
                    </p>
                  )}
                </CardBody>
              </Card>

              {/* Before you register */}
              {isOpen && (
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-[#5B21B6]" />
                      <h2 className="font-semibold text-gray-900">Before you register</h2>
                    </div>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
                      <li>Make sure you have a valid Juggernauts Athlete ID — registration requires one.</li>
                      <li>
                        Registration closes on{" "}
                        <strong>{format(deadline, "dd MMMM yyyy")}</strong>
                        {isClosingSoon ? " — don't wait!" : "."}
                      </li>
                      {event.registration_fee > 0 && (
                        <li>
                          A fee of <strong>₹{event.registration_fee}</strong> is required. Payment details will be shared after you register.
                        </li>
                      )}
                      {requiresGuardianConsent && (
                        <li>
                          This is an under-18 event. Guardian consent must be on record with Juggernauts.
                        </li>
                      )}
                      <li>Bring a copy of your Athlete ID card or QR code to the event venue.</li>
                    </ol>
                  </CardBody>
                </Card>
              )}

              {/* Organiser section */}
              {(event.organiser_name || event.organiser_contact_email || event.organiser_contact_phone) && (
                <Card>
                  <CardBody>
                    <h2 className="font-semibold text-gray-900 mb-3">Event Organiser</h2>
                    <div className="space-y-2">
                      {event.organiser_name && (
                        <p className="text-sm font-medium text-gray-900">{event.organiser_name}</p>
                      )}
                      {event.organiser_contact_email && (
                        <a
                          href={`mailto:${event.organiser_contact_email}`}
                          className="flex items-center gap-2 text-sm text-[#5B21B6] hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {event.organiser_contact_email}
                        </a>
                      )}
                      {event.organiser_contact_phone && (
                        <a
                          href={`tel:${event.organiser_contact_phone}`}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#5B21B6]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {event.organiser_contact_phone}
                        </a>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Registration sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardBody>
                  <h2 className="font-semibold text-gray-900 mb-4">Register</h2>

                  {/* Can't register reasons */}
                  {event.status === "completed" && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-4">
                      <p className="text-sm text-blue-800">This event has completed.</p>
                    </div>
                  )}
                  {event.status === "closed" && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-sm text-gray-600">Registrations are closed.</p>
                    </div>
                  )}
                  {event.status === "open" && deadlinePassed && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        Registration deadline passed on{" "}
                        <strong>{format(deadline, "dd MMM yyyy")}</strong>.
                      </p>
                    </div>
                  )}
                  {event.status === "open" && !deadlinePassed && isFull && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-red-800 font-medium">This event is full.</p>
                      <p className="text-xs text-red-700 mt-1">No spots remaining.</p>
                    </div>
                  )}

                  {/* Register button or status display */}
                  {(isOpen || existingRegistration) ? (
                    <EventRegisterButton
                      eventId={id}
                      eventName={event.name}
                      registrationFee={event.registration_fee}
                      user={user ? { id: user.id } : null}
                      athleteProfile={athleteProfile}
                      existingRegistration={existingRegistration}
                    />
                  ) : null}

                  {!isOpen && !existingRegistration && !user && (
                    <Link
                      href="/athlete/register"
                      className="block w-full text-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Create Athlete ID
                    </Link>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                      {regCount} registered
                      {event.max_participants ? ` of ${event.max_participants} max` : ""}
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
