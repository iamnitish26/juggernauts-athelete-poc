import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          return NextResponse.redirect(`${origin}/admin`);
        }
        if (profile?.role === "volunteer") {
          return NextResponse.redirect(`${origin}/volunteer`);
        }

        const { data: athlete } = await supabase
          .from("athletes")
          .select("athlete_id")
          .eq("user_id", user.id)
          .single();

        if (athlete) {
          return NextResponse.redirect(`${origin}/athlete/${athlete.athlete_id}`);
        }
        return NextResponse.redirect(`${origin}/athlete/register`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
