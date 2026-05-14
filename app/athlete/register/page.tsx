import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import AthleteRegistrationForm from "@/components/forms/AthleteRegistrationForm";

export const metadata = {
  title: "Register as Athlete | Juggernauts Athlete ID",
};

export default async function AthleteRegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/athlete/register");
  }

  // Check if athlete profile already exists
  const { data: existing } = await supabase
    .from("athletes")
    .select("athlete_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/athlete/${existing.athlete_id}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar user={{ email: user.email, role: profile?.role }} />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Create Your Athlete Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Get your unique Juggernauts Athlete ID — takes about 3 minutes
          </p>
        </div>
        <AthleteRegistrationForm userId={user.id} userEmail={user.email} />
      </main>
    </div>
  );
}
