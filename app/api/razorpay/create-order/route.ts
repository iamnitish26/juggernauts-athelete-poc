import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a Razorpay order via REST API — no npm package required
async function createRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return { error: "not_configured" as const };
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: "razorpay_error" as const, details: body };
  }

  const order = await res.json();
  return { order };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId } = body as { eventId?: string };
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // 2. Fetch event from server — never trust amount from frontend
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, status, registration_fee, registration_deadline, max_participants")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 3. Validate event is open for registration
    if (event.status !== "open") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(event.registration_deadline) < now) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
    }

    if (event.registration_fee <= 0) {
      return NextResponse.json({ error: "Event has no registration fee — use free registration" }, { status: 400 });
    }

    // 4. Validate athlete profile
    const { data: athlete, error: athleteError } = await supabase
      .from("athletes")
      .select("id, athlete_id, full_name")
      .eq("user_id", user.id)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json({ error: "Athlete profile not found" }, { status: 404 });
    }

    // 5. Check max participants
    if (event.max_participants) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if ((count ?? 0) >= event.max_participants) {
        return NextResponse.json({ error: "Event is full" }, { status: 400 });
      }
    }

    // 6. Check for existing confirmed registration (prevent duplicate)
    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id, registration_status, payment_status, razorpay_order_id")
      .eq("event_id", eventId)
      .eq("athlete_profile_id", athlete.id)
      .single();

    if (existing?.registration_status === "confirmed") {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 });
    }

    // 7. Create Razorpay order via REST API (amount in paise)
    const amountPaise = Math.round(event.registration_fee * 100);
    const result = await createRazorpayOrder({
      amount: amountPaise,
      currency: "INR",
      receipt: `reg_${athlete.id.slice(0, 8)}_${eventId.slice(0, 8)}`,
      notes: {
        event_id: eventId,
        athlete_profile_id: athlete.id,
        athlete_id: athlete.athlete_id,
        user_id: user.id,
      },
    });

    if (result.error === "not_configured") {
      return NextResponse.json(
        { error: "Payment is not configured for this platform yet. Please contact the organiser." },
        { status: 503 }
      );
    }

    if (result.error === "razorpay_error" || !result.order) {
      console.error("[create-order] Razorpay API error:", result.details);
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 502 });
    }

    const order = result.order;

    // 8. Upsert a pending registration row so we can track state
    const regPayload = {
      event_id: eventId,
      athlete_profile_id: athlete.id,
      athlete_id: athlete.athlete_id,
      registration_status: "pending",
      payment_status: "pending",
      razorpay_order_id: order.id,
      amount: event.registration_fee,
      currency: "INR",
    };

    if (existing) {
      await supabase
        .from("event_registrations")
        .update({
          registration_status: "pending",
          payment_status: "pending",
          razorpay_order_id: order.id,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("event_registrations").insert(regPayload);
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      eventName: event.name,
      athleteName: athlete.full_name,
      athleteId: athlete.athlete_id,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
