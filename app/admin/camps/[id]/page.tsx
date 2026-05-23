import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { format } from "date-fns";
import {
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  Star,
  ClipboardList,
  TrendingUp,
  Award,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  CAMP_STATUS_COLORS,
  CAMP_STATUS_LABELS,
  RECOMMENDATION_CATEGORY_COLORS,
} from "@/lib/constants";
import CampStatusButton from "@/components/camps/CampStatusButton";
import CampExportButtons from "@/components/camps/CampExportButtons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("camps").select("name").eq("id", id).single();
  return { title: data ? `${data.name} | Admin Camps` : "Camp | Admin" };
}

export default async function AdminCampDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: camp, error } = await supabase
    .from("camps")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !camp) notFound();

  // Participant stats
  const { data: participants } = await supabase
    .from("camp_participants")
    .select("id, attendance_status, camp_verification_status, recommendation_category, final_rating, athlete_id")
    .eq("camp_id", id);

  const total = participants?.length ?? 0;
  const attended = participants?.filter((p) => p.attendance_status === "attended").length ?? 0;
  const verified = participants?.filter((p) => p.camp_verification_status === "camp_verified").length ?? 0;
  const recommended = participants?.filter((p) => p.recommendation_category === "JSF Recommended").length ?? 0;
  const watchlist = participants?.filter((p) => p.recommendation_category === "JSF Watchlist").length ?? 0;
  const development = participants?.filter((p) => p.recommendation_category === "Development Track").length ?? 0;
  const participation = participants?.filter((p) => p.recommendation_category === "Participation Track").length ?? 0;
  const scored = participants?.filter((p) => p.final_rating != null).length ?? 0;

  // Test completion
  let testsCount = 0;
  let coachCount = 0;
  if (total > 0) {
    const [{ count: tc }, { count: cc }] = await Promise.all([
      supabase
        .from("test_results")
        .select("*", { count: "exact", head: true })
        .eq("camp_id", id),
      supabase
        .from("coach_assessments")
        .select("*", { count: "exact", head: true })
        .eq("camp_id", id),
    ]);
    testsCount = tc ?? 0;
    coachCount = cc ?? 0;
  }

  const statusColor = CAMP_STATUS_COLORS[camp.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = CAMP_STATUS_LABELS[camp.status] ?? camp.status;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/camps" className="hover:text-[#5B21B6] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Camps
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{camp.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{camp.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{format(new Date(camp.camp_date), "dd MMMM yyyy")}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{camp.venue}, {camp.district}</span>
            {camp.start_time && (
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{camp.start_time}{camp.end_time ? ` – ${camp.end_time}` : ""}</span>
            )}
          </div>
          {(camp.age_groups ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(camp.age_groups ?? []).map((ag: string) => (
                <span key={ag} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{ag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/admin/camps/${id}/participants`}>
            <Button size="sm" variant="outline">
              <Users className="w-4 h-4" />
              Participants
            </Button>
          </Link>
          <Link href={`/admin/camps/${id}/edit`}>
            <Button size="sm" variant="outline">Edit Camp</Button>
          </Link>
        </div>
      </div>

      {camp.description && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          {camp.description}
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Participants" value={total} icon={<Users className="w-5 h-5 text-[#5B21B6]" />} />
        <StatCard label="Attended" value={attended} icon={<CheckCircle className="w-5 h-5 text-green-600" />} color="bg-green-50" />
        <StatCard label="Scored" value={scored} icon={<ClipboardList className="w-5 h-5 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Camp Verified" value={verified} icon={<Award className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion status */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#5B21B6]" />
              Data Completion
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {[
              { label: "Test results entered", value: `${testsCount} records`, icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
              { label: "Coach assessments", value: `${coachCount} / ${total}`, icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
              { label: "Scores calculated", value: `${scored} / ${total}`, icon: <TrendingUp className="w-4 h-4 text-purple-500" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">{icon}{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Recommendation breakdown */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#5B21B6]" />
              Recommendation Summary
            </h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {[
              { cat: "JSF Recommended", count: recommended },
              { cat: "JSF Watchlist", count: watchlist },
              { cat: "Development Track", count: development },
              { cat: "Participation Track", count: participation },
            ].map(({ cat, count }) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    RECOMMENDATION_CATEGORY_COLORS[cat] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {cat}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {scored === 0 && (
              <p className="text-xs text-gray-400 pt-1">
                No scores calculated yet. Add participants, record tests, then calculate scores.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Actions</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/camps/${id}/participants`}>
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4" />
                Manage Participants
              </Button>
            </Link>
            <CampExportButtons campId={id} campName={camp.name} />
            <CampStatusButton campId={id} currentStatus={camp.status} />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            JSF recommendations are for further evaluation and do not guarantee selection.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
