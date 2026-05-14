import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import AthleteRegistrationForm from "@/components/forms/AthleteRegistrationForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Create Athlete Profile | Admin",
};

export default async function AdminCreateAthletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/admin/athletes/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar user={{ email: user.email, role: profile?.role }} />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <Link
            href="/admin/athletes"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#5B21B6] mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Athletes
          </Link>
          <h1 className="text-2xl font-bold text-[#111827]">Create Athlete Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">
            You are creating this Athlete ID on behalf of an athlete as an admin.
          </p>
        </div>
        <AthleteRegistrationForm
          userId={user.id}
          userEmail={user.email}
          mode="assisted"
          creatorRole="admin"
          createdByUserId={user.id}
        />
      </main>
    </div>
  );
}
