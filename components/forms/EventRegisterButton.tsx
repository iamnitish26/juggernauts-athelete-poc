"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Users } from "lucide-react";

interface AthleteProfile {
  id: string;
  athlete_id: string;
  full_name: string;
  verification_status: string;
}

interface ExistingRegistration {
  id: string;
  registration_status: string;
  payment_status: string;
  registered_at: string;
}

interface Props {
  eventId: string;
  eventName: string;
  registrationFee: number;
  user: { id: string } | null;
  athleteProfile: AthleteProfile | null;
  existingRegistration?: ExistingRegistration | null;
}

const REGISTRATION_STATUS_UI: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  confirmed: {
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    label: "Registration Confirmed",
    color: "text-green-800",
    bg: "bg-green-50 border-green-200",
  },
  pending: {
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    label: "Registration Pending",
    color: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
  },
  waitlisted: {
    icon: <Users className="w-4 h-4 text-blue-600" />,
    label: "On Waitlist",
    color: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
  },
  cancelled: {
    icon: <XCircle className="w-4 h-4 text-gray-500" />,
    label: "Registration Cancelled",
    color: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  },
};

export default function EventRegisterButton({
  eventId,
  eventName,
  registrationFee,
  user,
  athleteProfile,
  existingRegistration,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newRegistration, setNewRegistration] = useState<ExistingRegistration | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const activeReg = newRegistration ?? existingRegistration;

  async function handleRegister() {
    if (!user) {
      router.push(`/auth/login?redirectTo=/events/${eventId}`);
      return;
    }

    if (!athleteProfile) {
      router.push("/athlete/register");
      return;
    }

    setLoading(true);
    setError("");

    // TODO: If registrationFee > 0, initiate Razorpay order before inserting registration

    const { data, error: insertError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        athlete_profile_id: athleteProfile.id,
        athlete_id: athleteProfile.athlete_id,
        payment_status: registrationFee > 0 ? "pending" : "waived",
        registration_status: "confirmed",
      })
      .select("id, registration_status, payment_status, registered_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You are already registered for this event.");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    setNewRegistration(data);
    setLoading(false);
    router.refresh();
  }

  // Show existing registration status
  if (activeReg && activeReg.registration_status !== "cancelled") {
    const ui = REGISTRATION_STATUS_UI[activeReg.registration_status] ?? REGISTRATION_STATUS_UI.confirmed;
    return (
      <div className={`border rounded-xl p-4 ${ui.bg}`}>
        <div className="flex items-center gap-2 mb-1">
          {ui.icon}
          <span className={`font-semibold text-sm ${ui.color}`}>{ui.label}</span>
        </div>
        {activeReg.registration_status === "confirmed" && (
          <p className={`text-xs mt-1 ${ui.color}`}>
            {registrationFee > 0
              ? "Payment is pending — we'll reach out with payment details."
              : "You're all set! See you at the event."}
          </p>
        )}
        {activeReg.registration_status === "waitlisted" && (
          <p className={`text-xs mt-1 ${ui.color}`}>
            We'll notify you if a spot opens up.
          </p>
        )}
        {activeReg.registration_status === "pending" && (
          <p className={`text-xs mt-1 ${ui.color}`}>
            Your registration is being reviewed.
          </p>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <Link href={`/auth/login?redirectTo=/events/${eventId}`}>
          <Button className="w-full">Sign in to Register</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="outline" className="w-full" size="sm">
            Create Athlete ID
          </Button>
        </Link>
      </div>
    );
  }

  if (!athleteProfile) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-600">
          You need an Athlete ID to register for events.
        </p>
        <Link href="/athlete/register">
          <Button className="w-full">Create Athlete Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-purple-50 rounded-xl p-3">
        <p className="text-xs text-gray-500">Registering as:</p>
        <p className="font-semibold text-sm text-gray-900">{athleteProfile.full_name}</p>
        <p className="font-mono text-xs text-[#5B21B6]">{athleteProfile.athlete_id}</p>
      </div>

      {registrationFee > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs text-yellow-800">
            {/* TODO: Replace with Razorpay payment flow */}
            Registration fee: <strong>₹{registrationFee}</strong>
            <br />
            Payment details will be shared after registration.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <Button onClick={handleRegister} loading={loading} className="w-full">
        {registrationFee > 0 ? `Register — ₹${registrationFee}` : "Register Free"}
      </Button>
    </div>
  );
}
