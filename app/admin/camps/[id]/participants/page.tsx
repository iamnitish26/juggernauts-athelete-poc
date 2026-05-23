import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, UserPlus } from "lucide-react";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
  CAMP_VERIFICATION_STATUS_LABELS,
  CAMP_VERIFICATION_STATUS_COLORS,
  RECOMMENDATION_CATEGORY_COLORS,
} from "@/lib/constants";
import AddParticipantPanel from "@/components/camps/AddParticipantPanel";
import AttendanceButton from "@/components/camps/AttendanceButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Participants | Admin Camps" };

export default async function CampParticipantsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: camp, error: campError } = await supabase
    .from("camps")
    .select("id, name, status")
    .eq("id", id)
    .single();

  if (campError || !camp) notFound();

  const { data: participants } = await supabase
    .from("camp_participants")
    .select(
      `id, attendance_status, camp_verification_status, recommendation_category,
       final_rating, final_score_100, consent_verified, public_summary_enabled,
       athletes(id, athlete_id, full_name, primary_sport, age_group, gender, district, verification_status)`
    )
    .eq("camp_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/admin/camps/${id}`} className="hover:text-[#5B21B6] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          {camp.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Participants</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500">{participants?.length ?? 0} registered</p>
        </div>
      </div>

      {/* Add participant */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#5B21B6]" />
            Add Participant
          </h2>
        </CardHeader>
        <CardBody>
          <AddParticipantPanel campId={id} />
        </CardBody>
      </Card>

      {/* Participant list */}
      {participants && participants.length > 0 ? (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-4 py-3 font-semibold text-gray-600">Athlete</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Sport / Age</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Attendance</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Camp Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Rating</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Recommendation</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p) => {
                  const athlete = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
                  const attendColor = ATTENDANCE_STATUS_COLORS[p.attendance_status] ?? "bg-gray-100 text-gray-600";
                  const attendLabel = ATTENDANCE_STATUS_LABELS[p.attendance_status] ?? p.attendance_status;
                  const campVerifColor = CAMP_VERIFICATION_STATUS_COLORS[p.camp_verification_status] ?? "bg-gray-100 text-gray-600";
                  const campVerifLabel = CAMP_VERIFICATION_STATUS_LABELS[p.camp_verification_status] ?? p.camp_verification_status;
                  const recColor = p.recommendation_category
                    ? (RECOMMENDATION_CATEGORY_COLORS[p.recommendation_category] ?? "bg-gray-100 text-gray-600")
                    : "";
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{athlete?.full_name ?? "—"}</p>
                        <p className="text-xs font-mono text-[#5B21B6]">{athlete?.athlete_id ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <p>{athlete?.primary_sport}</p>
                        <p>{athlete?.age_group} · {athlete?.gender}</p>
                      </td>
                      <td className="px-4 py-3">
                        <AttendanceButton
                          participantId={p.id}
                          currentStatus={p.attendance_status}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${campVerifColor}`}>
                          {campVerifLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.final_rating != null ? (
                          <span className="font-bold text-[#5B21B6]">{p.final_rating.toFixed(1)}</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.recommendation_category ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${recColor}`}>
                            {p.recommendation_category}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {athlete && (
                          <Link href={`/admin/camps/${id}/results/${athlete.id}`}>
                            <Button variant="outline" size="sm">Results</Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {participants.map((p) => {
              const athlete = Array.isArray(p.athletes) ? p.athletes[0] : p.athletes;
              const attendColor = ATTENDANCE_STATUS_COLORS[p.attendance_status] ?? "bg-gray-100 text-gray-600";
              const attendLabel = ATTENDANCE_STATUS_LABELS[p.attendance_status] ?? p.attendance_status;
              const recColor = p.recommendation_category
                ? (RECOMMENDATION_CATEGORY_COLORS[p.recommendation_category] ?? "bg-gray-100 text-gray-600")
                : "";
              return (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{athlete?.full_name ?? "—"}</p>
                      <p className="text-xs font-mono text-[#5B21B6]">{athlete?.athlete_id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{athlete?.primary_sport} · {athlete?.age_group}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${attendColor}`}>
                      {attendLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {p.recommendation_category && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${recColor}`}>
                        {p.recommendation_category}
                      </span>
                    )}
                    {p.final_rating != null && (
                      <span className="text-xs font-bold text-[#5B21B6]">Rating: {p.final_rating.toFixed(1)}</span>
                    )}
                  </div>
                  {athlete && (
                    <div className="mt-3">
                      <Link href={`/admin/camps/${id}/results/${athlete.id}`}>
                        <Button variant="outline" size="sm" className="w-full">View Results</Button>
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-sm">No participants yet. Add athletes using the form above.</p>
        </Card>
      )}
    </div>
  );
}
