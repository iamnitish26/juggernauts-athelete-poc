"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Users, AlertTriangle } from "lucide-react";

// Razorpay is loaded via <script> in the layout; declare the global type here.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

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
  confirmed_at?: string | null;
}

interface Props {
  eventId: string;
  eventName: string;
  registrationFee: number;
  user: { id: string } | null;
  athleteProfile: AthleteProfile | null;
  existingRegistration?: ExistingRegistration | null;
}

const REG_STATUS_UI: Record<string, { icon: React.ReactNode; label: string; textColor: string; bg: string }> = {
  confirmed: {
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
    label: "Registration Confirmed",
    textColor: "text-green-800",
    bg: "bg-green-50 border-green-200",
  },
  pending: {
    icon: <Clock className="w-4 h-4 text-yellow-600" />,
    label: "Registration Pending",
    textColor: "text-yellow-800",
    bg: "bg-yellow-50 border-yellow-200",
  },
  waitlisted: {
    icon: <Users className="w-4 h-4 text-blue-600" />,
    label: "On Waitlist",
    textColor: "text-blue-800",
    bg: "bg-blue-50 border-blue-200",
  },
  cancelled: {
    icon: <XCircle className="w-4 h-4 text-gray-500" />,
    label: "Registration Cancelled",
    textColor: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  },
  failed: {
    icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
    label: "Registration Failed",
    textColor: "text-red-800",
    bg: "bg-red-50 border-red-200",
  },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  not_required: "No payment required",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
  waived: "Fee waived",
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function EventRegisterButton({
  eventId,
  eventName,
  registrationFee,
  user,
  athleteProfile,
  existingRegistration,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Processing...");
  const [error, setError] = useState("");
  const [confirmedReg, setConfirmedReg] = useState<ExistingRegistration | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isPaid = registrationFee > 0;
  const activeReg = confirmedReg ?? existingRegistration;

  // ── Free registration ─────────────────────────────────────────────────────
  async function handleFreeRegister() {
    if (!user) { router.push(`/auth/login?redirectTo=/events/${eventId}`); return; }
    if (!athleteProfile) { router.push("/athlete/register"); return; }

    setLoading(true);
    setLoadingLabel("Registering...");
    setError("");

    const { data, error: insertError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        athlete_profile_id: athleteProfile.id,
        athlete_id: athleteProfile.athlete_id,
        registration_status: "confirmed",
        payment_status: "not_required",
        amount: 0,
        currency: "INR",
      })
      .select("id, registration_status, payment_status, registered_at, confirmed_at")
      .single();

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "You are already registered for this event."
          : insertError.message
      );
      setLoading(false);
      return;
    }

    setConfirmedReg(data);
    setLoading(false);
    router.refresh();
  }

  // ── Paid registration via Razorpay ────────────────────────────────────────
  async function handlePaidRegister() {
    if (!user) { router.push(`/auth/login?redirectTo=/events/${eventId}`); return; }
    if (!athleteProfile) { router.push("/athlete/register"); return; }

    setLoading(true);
    setLoadingLabel("Opening secure payment...");
    setError("");

    // Load Razorpay checkout script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Could not load payment gateway. Check your connection and try again.");
      setLoading(false);
      return;
    }

    // Create Razorpay order via secure backend
    let orderData: { orderId: string; amount: number; currency: string; athleteName: string; athleteId: string };
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create payment order.");
        setLoading(false);
        return;
      }
      orderData = json;
    } catch {
      setError("Network error while creating order. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false); // Razorpay UI takes over

    // Open Razorpay checkout
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Juggernauts Athlete ID",
      description: `Event Registration - ${eventName}`,
      theme: { color: "#5B21B6" },
      prefill: {
        name: orderData.athleteName,
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        // Payment succeeded on Razorpay — now verify signature on backend
        setLoading(true);
        setLoadingLabel("Verifying payment...");

        try {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId,
            }),
          });
          const verifyJson = await verifyRes.json();

          if (!verifyRes.ok || !verifyJson.success) {
            setError(
              verifyJson.error ??
                "Payment received but verification failed. Contact support with your payment ID: " +
                  response.razorpay_payment_id
            );
            setLoading(false);
            return;
          }

          // Fetch updated registration to show confirmed status
          const { data: updated } = await supabase
            .from("event_registrations")
            .select("id, registration_status, payment_status, registered_at, confirmed_at")
            .eq("event_id", eventId)
            .eq("athlete_profile_id", athleteProfile.id)
            .single();

          setConfirmedReg(updated ?? {
            id: "",
            registration_status: "confirmed",
            payment_status: "paid",
            registered_at: new Date().toISOString(),
          });
          setLoading(false);
          router.refresh();
        } catch {
          setError("Network error during payment verification. If money was debited, contact support.");
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          // User closed checkout without paying
          setError("Payment was not completed. Your event registration is not confirmed.");
          setLoading(false);
        },
      },
    });

    rzp.open();
  }

  // ── Show registration status if confirmed/pending/waitlisted ──────────────
  if (activeReg && activeReg.registration_status !== "cancelled" && activeReg.registration_status !== "failed") {
    const ui = REG_STATUS_UI[activeReg.registration_status] ?? REG_STATUS_UI.confirmed;
    return (
      <div className="space-y-3">
        <div className={`border rounded-xl p-4 ${ui.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            {ui.icon}
            <span className={`font-semibold text-sm ${ui.textColor}`}>{ui.label}</span>
          </div>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <dt className={`${ui.textColor} opacity-70`}>Payment</dt>
              <dd className={`font-medium ${ui.textColor}`}>
                {PAYMENT_STATUS_LABEL[activeReg.payment_status] ?? activeReg.payment_status}
              </dd>
            </div>
            {activeReg.registration_status === "confirmed" && activeReg.confirmed_at && (
              <div className="flex justify-between text-xs">
                <dt className={`${ui.textColor} opacity-70`}>Confirmed</dt>
                <dd className={`font-medium ${ui.textColor}`}>
                  {new Date(activeReg.confirmed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </dd>
              </div>
            )}
          </dl>
          {activeReg.registration_status === "confirmed" && (
            <p className={`text-xs mt-2 ${ui.textColor}`}>
              {isPaid ? "Payment successful. See you at the event!" : "You're all set! See you at the event."}
            </p>
          )}
          {activeReg.registration_status === "pending" && (
            <p className={`text-xs mt-2 ${ui.textColor}`}>
              {isPaid
                ? "Payment pending — complete payment to confirm your spot."
                : "Your registration is being reviewed."}
            </p>
          )}
        </div>

        {/* Retry payment if pending paid registration */}
        {activeReg.registration_status === "pending" && isPaid && (
          <>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}
            <Button
              onClick={handlePaidRegister}
              loading={loading}
              className="w-full"
            >
              {loading ? loadingLabel : `Retry Payment — ₹${registrationFee}`}
            </Button>
          </>
        )}
      </div>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
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

  // ── No athlete profile ────────────────────────────────────────────────────
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

  // ── Ready to register ─────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="bg-purple-50 rounded-xl p-3">
        <p className="text-xs text-gray-500">Registering as:</p>
        <p className="font-semibold text-sm text-gray-900">{athleteProfile.full_name}</p>
        <p className="font-mono text-xs text-[#5B21B6]">{athleteProfile.athlete_id}</p>
      </div>

      {isPaid && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
          <p className="text-xs text-yellow-800">
            Registration fee: <strong>₹{registrationFee}</strong>
            <br />
            You&apos;ll be taken to a secure payment page.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <Button
        onClick={isPaid ? handlePaidRegister : handleFreeRegister}
        loading={loading}
        className="w-full"
      >
        {loading ? loadingLabel : isPaid ? `Pay ₹${registrationFee} & Register` : "Register for Free"}
      </Button>
    </div>
  );
}
