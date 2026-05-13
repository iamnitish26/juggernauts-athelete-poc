"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface AthleteProfile {
  id: string;
  athlete_id: string;
  full_name: string;
  verification_status: string;
}

interface Props {
  eventId: string;
  eventName: string;
  registrationFee: number;
  user: { id: string } | null;
  athleteProfile: AthleteProfile | null;
}

export default function EventRegisterButton({
  eventId,
  eventName,
  registrationFee,
  user,
  athleteProfile,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
    // const razorpayOrder = await createRazorpayOrder(registrationFee);
    // Then open Razorpay checkout and on success, insert with payment_status: 'paid'

    const { error: insertError } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      athlete_profile_id: athleteProfile.id,
      athlete_id: athleteProfile.athlete_id,
      payment_status: registrationFee > 0 ? "pending" : "waived",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You are already registered for this event.");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-800 font-semibold text-sm">
          ✓ Successfully registered!
        </p>
        <p className="text-green-700 text-xs mt-1">
          {registrationFee > 0
            ? "Payment is pending. We'll contact you with payment details."
            : "See you at the event!"}
        </p>
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
