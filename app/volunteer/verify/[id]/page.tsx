import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import VolunteerVerifyActions from "@/components/dashboard/VolunteerVerifyActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Verify Athlete | Volunteer" };

export default async function VolunteerVerifyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Volunteers see safe verification fields only — no private contact details
  const { data: athlete, error } = await supabase
    .from("athletes")
    .select(`
      id, athlete_id, full_name, gender, age_group, date_of_birth,
      primary_sport, position_event_category, district, state, city_block,
      current_club_school, years_of_experience,
      achievement_summary, video_link, instagram_link,
      verification_status, verification_notes,
      photo_consent, profile_photo_url,
      data_consent, created_at
    `)
    .eq("id", id)
    .single();

  if (error || !athlete) notFound();

  const age = (() => {
    const birth = new Date(athlete.date_of_birth);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      a--;
    return a;
  })();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/volunteer/verify" className="hover:text-[#5B21B6]">
          Verify Athletes
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{athlete.full_name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{athlete.full_name}</h1>
          <p className="font-mono text-sm text-[#5B21B6] mt-0.5">{athlete.athlete_id}</p>
        </div>
        <VerificationBadge status={athlete.verification_status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Profile Summary</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Sport", athlete.primary_sport],
                ["Position", athlete.position_event_category || "—"],
                ["Age Group", athlete.age_group],
                ["Age", `${age} years`],
                ["Gender", athlete.gender],
                ["District", `${athlete.district}, ${athlete.state}`],
                ["City / Block", athlete.city_block || "—"],
                ["Club / School", athlete.current_club_school || "—"],
                ["Experience", athlete.years_of_experience ? `${athlete.years_of_experience} years` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Achievements & Links</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {athlete.achievement_summary || "No achievements listed"}
            </p>
            {athlete.video_link && (
              <a
                href={athlete.video_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#5B21B6] hover:underline block"
              >
                🎥 View highlight video
              </a>
            )}
            {athlete.instagram_link && (
              <p className="text-xs text-gray-500 mt-1">
                Instagram: {athlete.instagram_link}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Verification</h2>
        </CardHeader>
        <CardBody>
          <VolunteerVerifyActions
            athleteDbId={athlete.id}
            currentStatus={athlete.verification_status}
            currentNotes={athlete.verification_notes ?? ""}
          />
        </CardBody>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        🔒 Private contact details are hidden from volunteers to protect athlete privacy.
      </p>
    </div>
  );
}
