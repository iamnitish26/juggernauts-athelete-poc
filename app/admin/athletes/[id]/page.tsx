import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import AdminVerifyActions from "@/components/dashboard/AdminVerifyActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Athlete Detail | Admin" };

export default async function AdminAthleteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: athlete, error } = await supabase
    .from("athletes")
    .select("*")
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/athletes" className="hover:text-[#5B21B6]">
          Athletes
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Personal details (admin sees all) */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Personal Details</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Gender", athlete.gender],
                ["Date of Birth", `${athlete.date_of_birth} (Age ${age})`],
                ["Age Group", athlete.age_group],
                ["State", athlete.state],
                ["District", athlete.district],
                ["City / Block", athlete.city_block || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Sport details */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Sport Information</h2>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Primary Sport", athlete.primary_sport],
                ["Position", athlete.position_event_category || "—"],
                ["Dominant Side", athlete.dominant_side || "—"],
                ["Club / School", athlete.current_club_school || "—"],
                ["Experience", athlete.years_of_experience ? `${athlete.years_of_experience} years` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Private contact (admin only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Contact Details</h2>
              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                Private
              </span>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ["Athlete Phone", athlete.athlete_phone || "—"],
                ["Athlete Email", athlete.athlete_email || "—"],
                ["Guardian Name", athlete.guardian_name || "—"],
                ["Guardian Phone", athlete.guardian_phone || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Achievements</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {athlete.achievement_summary || "—"}
            </p>
            <dl className="space-y-2 text-sm">
              {athlete.video_link && (
                <div>
                  <dt className="text-gray-500 text-xs">Video</dt>
                  <a
                    href={athlete.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5B21B6] hover:underline text-xs"
                  >
                    {athlete.video_link}
                  </a>
                </div>
              )}
              {athlete.instagram_link && (
                <div>
                  <dt className="text-gray-500 text-xs">Instagram</dt>
                  <p className="text-xs">{athlete.instagram_link}</p>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Verification actions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Verification Actions</h2>
        </CardHeader>
        <CardBody>
          <AdminVerifyActions
            athleteDbId={athlete.id}
            currentStatus={athlete.verification_status}
            currentNotes={athlete.verification_notes ?? ""}
          />
        </CardBody>
      </Card>
    </div>
  );
}
