import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { VerificationBadge } from "@/components/ui/Badge";
import AthleteQRCode from "@/components/ui/AthleteQRCode";
import { MapPin, Trophy, BookOpen, Share2, ExternalLink, User } from "lucide-react";
import type { Athlete } from "@/types";

interface PageProps {
  params: Promise<{ athleteId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { athleteId } = await params;
  return {
    title: `${athleteId} | Juggernauts Athlete Profile`,
    description: `View the public sports profile for athlete ${athleteId} on the Juggernauts platform.`,
  };
}

export default async function AthleteProfilePage({ params }: PageProps) {
  const { athleteId } = await params;
  const supabase = await createClient();

  // Fetch only public-safe fields — never expose phone, email, guardian, exact DOB
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select(
      `
      athlete_id, full_name, profile_photo_url, photo_consent,
      primary_sport, position_event_category, district, state,
      age_group, current_club_school, achievement_summary,
      verification_status, instagram_link, video_link,
      date_of_birth, is_active, created_at
    `
    )
    .eq("athlete_id", athleteId)
    .eq("is_active", true)
    .single();

  if (error || !athlete) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    navUser = { email: user.email, role: profile?.role };
  }

  // Derive age from DOB (show only age group, not exact DOB)
  const birth = new Date(athlete.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;

  const memberSince = new Date(athlete.created_at).getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar user={navUser} />

      <main className="flex-1">
        {/* Profile header */}
        <div
          className="pt-12 pb-20 px-4"
          style={{
            background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 60%, #7C3AED 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto text-white text-center">
            {/* Avatar */}
            <div className="mx-auto mb-4 w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/20 shadow-lg bg-white/10">
              {athlete.profile_photo_url && athlete.photo_consent ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.profile_photo_url}
                  alt={athlete.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white/60" />
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-1">{athlete.full_name}</h1>

            <p className="font-mono text-sm text-purple-200 mb-3">
              {athlete.athlete_id}
            </p>

            <VerificationBadge
              status={athlete.verification_status}
              className="mb-4"
            />

            <div className="flex items-center justify-center gap-1 text-purple-200 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {athlete.district}, {athlete.state}
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="max-w-2xl mx-auto px-4 -mt-10 pb-12">
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            {/* Sport info grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: "Sport", value: athlete.primary_sport },
                { label: "Age Group", value: athlete.age_group },
                {
                  label: "Position / Event",
                  value: athlete.position_event_category || "—",
                },
                { label: "Age", value: `${age} years` },
                {
                  label: "Club / School",
                  value: athlete.current_club_school || "—",
                },
                { label: "Member Since", value: String(memberSince) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F8FAFC] rounded-xl p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5 text-sm">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Achievements */}
            {athlete.achievement_summary && (
              <div className="px-6 pb-4">
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-[#5B21B6]" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Achievements
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {athlete.achievement_summary}
                  </p>
                </div>
              </div>
            )}

            {/* Player bio placeholder */}
            <div className="px-6 pb-4">
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-[#5B21B6]" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Player Summary
                  </h3>
                </div>
                <p className="text-sm text-gray-500 italic">
                  {/* TODO: Replace with AI-generated bio when feature is built */}
                  A dedicated {athlete.primary_sport} player from{" "}
                  {athlete.district}, Odisha. Competing in the{" "}
                  {athlete.age_group} category
                  {athlete.position_event_category
                    ? ` as a ${athlete.position_event_category}`
                    : ""}
                  .
                </p>
              </div>
            </div>

            {/* Social links */}
            {(athlete.instagram_link || athlete.video_link) && (
              <div className="px-6 pb-4">
                <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-3">
                  {athlete.instagram_link && (
                    <a
                      href={
                        athlete.instagram_link.startsWith("http")
                          ? athlete.instagram_link
                          : `https://instagram.com/${athlete.instagram_link.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#5B21B6] hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Instagram
                    </a>
                  )}
                  {athlete.video_link && (
                    <a
                      href={athlete.video_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#5B21B6] hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Highlight Video
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* QR + Share */}
            <div className="border-t border-gray-100 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <AthleteQRCode athleteId={athlete.athlete_id} size={100} />
              <ShareButton athleteId={athlete.athlete_id} name={athlete.full_name} />
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 This is a public profile. Private data (phone, email, date of birth,
            guardian details) is never shown here.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ShareButton({ athleteId, name }: { athleteId: string; name: string }) {
  return (
    <div className="flex flex-col items-center sm:items-end gap-2 text-center sm:text-right">
      <p className="text-xs text-gray-500 max-w-xs">
        Share this profile on WhatsApp, Instagram, or copy the link
      </p>
      <ShareButtonClient athleteId={athleteId} name={name} />
    </div>
  );
}

// Client component for the share button
function ShareButtonClient({ athleteId, name }: { athleteId: string; name: string }) {
  "use client";
  // Rendered as-is — interactivity added via onClick in a client wrapper
  // For now, renders as a regular anchor; full client share uses ShareButtonWrapper
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(
        `🏆 Check out ${name}'s athlete profile on Juggernauts!\n\n${
          process.env.NEXT_PUBLIC_APP_URL ??
          (typeof window !== "undefined" ? window.location.origin : "")
        }/athlete/${athleteId}`
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
    >
      <Share2 className="w-4 h-4" />
      Share on WhatsApp
    </a>
  );
}
