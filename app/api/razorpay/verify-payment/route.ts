import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS — only used after HMAC signature is verified
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } =
      body as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        eventId?: string;
      };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify HMAC SHA256 signature — this is the security gate
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    // 3. Fetch the pending registration tied to this order
    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .select("id, event_id, athlete_profile_id, registration_status, payment_status, razorpay_order_id, amount")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("event_id", eventId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found for this order" }, { status: 404 });
    }

    // 4. Guard: ensure this registration belongs to the calling user
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!athlete || athlete.id !== registration.athlete_profile_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Guard: prevent double-confirmation
    if (registration.registration_status === "confirmed") {
      return NextResponse.json({ success: true, alreadyConfirmed: true });
    }

    // 6. Confirm registration using service-role client (bypasses RLS for update)
    const service = getServiceClient();
    const { error: updateError } = await service
      .from("event_registrations")
      .update({
        registration_status: "confirmed",
        payment_status: "paid",
        razorpay_payment_id,
        razorpay_signature,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error("[verify-payment] update failed", updateError);
      return NextResponse.json({ error: "Failed to confirm registration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-payment]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
