import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { VerificationBadge } from "@/components/ui/Badge";
import AthleteQRCode from "@/components/ui/AthleteQRCode";
import SharePanel from "./SharePanel";
import PlayerCard from "./PlayerCard";
import {
  MapPin,
  Trophy,
  BookOpen,
  ExternalLink,
  Lock,
  Mail,
  Award,
  CheckCircle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ athleteId: string }>;
}

const VERIFICATION_EXPLANATIONS: Record<string, string> = {
  self_registered:
    "Profile submitted by athlete/guardian. Not yet verified by Juggernauts.",
  community_verified: "Verified by a Juggernauts volunteer.",
  event_verified:
    "Verified through participation in a Juggernauts or partner event.",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function generateMetadata({ params }: PageProps) {
  const { athleteId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("athletes")
    .select("full_name, primary_sport, district, profile_status, is_public")
    .eq("athlete_id", athleteId)
    .single();

  if (!data || data.profile_status !== "approved" || !data.is_public) {
    return {
      title: "Athlete Profile | Juggernauts Athlete ID",
    };
  }

  return {
    title: `${data.full_name} — ${data.primary_sport} | Juggernauts Athlete ID`,
    description: `${data.full_name} is a ${data.primary_sport} player from ${data.district}, Odisha. View their Juggernauts Athlete ID profile.`,
    openGraph: {
      title: `${data.full_name} | Juggernauts Athlete ID`,
      description: `${data.primary_sport} · ${data.district}, Odisha · ${athleteId}`,
    },
  };
}

export default async function AthleteProfilePage({ params }: PageProps) {
  const { athleteId } = await params;
  const supabase = await createClient();

  // Fetch public-safe fields only — never expose phone, email, guardian, exact DOB
  // profile_status and is_public are needed to enforce visibility logic
  const { data: athlete, error: athleteQueryError } = await supabase
    .from("athletes")
    .select(
      `
      id, athlete_id, full_name, profile_photo_url, photo_consent,
      primary_sport, position_event_category, district, state,
      age_group, current_club_school, achievement_summary,
      verification_status, instagram_link, video_link,
      is_active, created_at, profile_status, is_public
    `
    )
    .eq("athlete_id", athleteId)
    .single();

  // PGRST116 = "no rows returned" (profile doesn't exist or RLS blocked it) — expected
  // Any other error = real DB problem (missing column, schema mismatch, etc.)
  if (athleteQueryError && athleteQueryError.code !== "PGRST116") {
    console.error(
      `[athlete/${athleteId}] DB query error — code: ${athleteQueryError.code}, message: ${athleteQueryError.message}. ` +
        "Check that all migrations (001–009) have been applied in Supabase SQL Editor."
    );
  }

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

  // Load camp score if public_summary_enabled — only show if profile is approved and public
  let campScore = null;
  if (athlete && athlete.profile_status === "approved" && athlete.is_public) {
    const { data: cp } = await supabase
      .from("camp_participants")
      .select(`
        public_summary_enabled,
        athlete_camp_scores(rating_10, recommendation_category, confidence_label, small_cohort_warning),
        camps(name, sport, district, camp_date)
      `)
      .eq("athlete_id", athlete.id)
      .eq("public_summary_enabled", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cp?.public_summary_enabled) campScore = cp;
  }

  // Show "not available" when:
  //   - athlete not found (ID doesn't exist, or RLS blocks it for non-owner)
  //   - profile_status is not approved (treat missing column as backwards-compat approved)
  //   - is_public is false (treat missing column as backwards-compat true)
  const isApproved =
    !athlete ||
    (athlete.profile_status !== undefined
      ? athlete.profile_status === "approved"
      : true);
  const isPublic =
    !athlete ||
    (athlete.is_public !== undefined ? athlete.is_public === true : true);

  if (!athlete || !isApproved || !isPublic) {
    const isAdminViewing = navUser?.role === "admin";
    // Admin-only debug hint: shows why the profile is hidden without exposing data to public
    const adminHint = isAdminViewing
      ? !athlete
        ? athleteQueryError && athleteQueryError.code !== "PGRST116"
          ? "A database error occurred. Ensure all migrations (001–009) have been applied in Supabase SQL Editor."
          : "No profile found for this Athlete ID — it may not exist or RLS is blocking the read."
        : !isApproved
        ? `Profile exists but profile_status = "${athlete.profile_status}". Click Approve Public Profile in the admin panel.`
        : `Profile exists but is_public = false. Click Approve Public Profile in the admin panel.`
      : null;

    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar user={navUser} />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-[#F3E8FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#5B21B6]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Profile Not Available
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              This Athlete ID profile is not publicly available. It may be
              pending review or has not been approved yet.
            </p>
            {adminHint && (
              <div className="mb-6 text-left text-xs bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-800">
                <span className="font-bold">Admin debug:</span> {adminHint}
              </div>
            )}
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const memberSince = new Date(athlete.created_at).getFullYear();
  const initials = getInitials(athlete.full_name);
  const profileUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? ""
  }/athlete/${athleteId}`;
  const showPhoto = !!(athlete.profile_photo_url && athlete.photo_consent);
  const verificationExplanation =
    VERIFICATION_EXPLANATIONS[athlete.verification_status] ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar user={navUser} />

      <main className="flex-1">
        {/* Profile header */}
        <div
          className="pt-12 pb-20 px-4"
          style={{
            background:
              "linear-gradient(135deg, #3B0764 0%, #5B21B6 60%, #7C3AED 100%)",
          }}
        >
          <div className="max-w-2xl mx-auto text-white text-center">
            {/* Avatar */}
            <div className="mx-auto mb-4 w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/20 shadow-lg bg-white/10">
              {showPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={athlete.profile_photo_url!}
                  alt={athlete.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-white/90">
                    {initials}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-1">{athlete.full_name}</h1>

            <p className="font-mono text-sm text-purple-200 mb-3">
              {athlete.athlete_id}
            </p>

            <div className="flex flex-col items-center gap-1 mb-3">
              <VerificationBadge status={athlete.verification_status} />
              {verificationExplanation && (
                <p className="text-xs text-purple-300 max-w-xs">
                  {verificationExplanation}
                </p>
              )}
              {campScore && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Camp Verified — Football
                  </span>
                  {campScore.athlete_camp_scores && (
                    <div className="mt-1 text-xs text-gray-500">
                      {Array.isArray(campScore.athlete_camp_scores)
                        ? campScore.athlete_camp_scores[0]?.recommendation_category
                        : (campScore.athlete_camp_scores as { recommendation_category?: string })?.recommendation_category}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1 text-purple-200 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {athlete.district}, {athlete.state}
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="max-w-2xl mx-auto px-4 -mt-10 pb-12 space-y-4">
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            {/* Sport info grid — no exact age, age group only */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: "Sport", value: athlete.primary_sport },
                { label: "Age Group", value: athlete.age_group },
                {
                  label: "Position / Event",
                  value: athlete.position_event_category || "—",
                },
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

            {/* Achievements — always shown */}
            <div className="px-6 pb-4">
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-[#5B21B6]" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Achievements
                  </h3>
                </div>
                {athlete.achievement_summary ? (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {athlete.achievement_summary}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No achievements added yet.
                  </p>
                )}
              </div>
            </div>

            {/* Player summary */}
            <div className="px-6 pb-4">
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-[#5B21B6]" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Player Summary
                  </h3>
                </div>
                <p className="text-sm text-gray-500 italic">
                  {/* TODO: Replace with AI-generated bio from achievement_summary when feature is built */}
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

            {/* Camp Verified section */}
            {campScore && (
              <div className="px-6 pb-4">
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span className="text-sm font-bold text-emerald-900">JSF Camp Verified</span>
                  </div>
                  {(() => {
                    const scores = Array.isArray(campScore.athlete_camp_scores)
                      ? campScore.athlete_camp_scores[0]
                      : campScore.athlete_camp_scores as { rating_10?: number; recommendation_category?: string } | null;
                    const camp = Array.isArray(campScore.camps) ? campScore.camps[0] : campScore.camps as { name?: string; district?: string } | null;
                    return (
                      <>
                        {scores?.rating_10 != null && (
                          <p className="text-sm text-emerald-800 font-semibold">Rating: {scores.rating_10.toFixed(1)} / 10</p>
                        )}
                        {scores?.recommendation_category && (
                          <p className="text-xs text-emerald-700 mt-0.5">{scores.recommendation_category}</p>
                        )}
                        {camp?.name && (
                          <p className="text-xs text-gray-500 mt-1">{camp.name}{camp.district ? ` · ${camp.district}` : ""}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                          Camp Verified indicates this athlete attended a structured JSF football assessment camp. It is not a guarantee of selection.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Social links */}
            {(athlete.instagram_link || athlete.video_link) && (
              <div className="px-6 pb-4">
                <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-3">
                  {athlete.instagram_link && (
                    <a
                      href={
                        athlete.instagram_link.startsWith("http")
                          ? athlete.instagram_link
                          : `https://instagram.com/${athlete.instagram_link.replace(
                              "@",
                              ""
                            )}`
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

            {/* QR code */}
            <div className="border-t border-gray-100 px-6 py-5 flex justify-center">
              <AthleteQRCode athleteId={athlete.athlete_id} size={100} />
            </div>
          </div>

          {/* Share section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              Share this profile
            </h3>
            <SharePanel
              athleteId={athlete.athlete_id}
              name={athlete.full_name}
              sport={athlete.primary_sport}
              ageGroup={athlete.age_group}
              district={athlete.district}
              profileUrl={profileUrl}
            />
          </div>

          {/* Player card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Shareable Player Card
            </h3>
            <PlayerCard
              athleteId={athlete.athlete_id}
              name={athlete.full_name}
              sport={athlete.primary_sport}
              district={athlete.district}
              ageGroup={athlete.age_group}
              positionEvent={athlete.position_event_category}
              verificationStatus={athlete.verification_status}
              initials={initials}
              photoUrl={athlete.profile_photo_url}
              photoConsent={athlete.photo_consent}
            />
          </div>

          {/* Request correction */}
          <div className="text-center">
            <a
              href={`mailto:hello@juggernauts.in?subject=Profile Correction Request — ${athleteId}&body=Athlete ID: ${athleteId}%0D%0AName: ${athlete.full_name}%0D%0A%0D%0APlease describe the correction needed:%0D%0A`}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#5B21B6] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Request a correction for this profile
            </a>
          </div>

          {/* Privacy note */}
          <p className="text-center text-xs text-gray-400">
            <Lock className="w-3 h-3 inline mr-1" />
            This is a public profile. Private data (phone, email, date of birth,
            guardian details) is never shown here.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
