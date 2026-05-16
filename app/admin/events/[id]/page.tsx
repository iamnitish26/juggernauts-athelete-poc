import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Users, IndianRupee } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("name").eq("id", id).single();
  return { title: `${data?.name ?? "Event"} | Admin` };
}

const REG_STATUS_COLORS: Record<string, string> = {
  confirmed:  "bg-green-100 text-green-800",
  pending:    "bg-yellow-100 text-yellow-800",
  waitlisted: "bg-blue-100 text-blue-800",
  cancelled:  "bg-gray-100 text-gray-500",
  failed:     "bg-red-100 text-red-700",
};

const PAY_STATUS_COLORS: Record<string, string> = {
  not_required: "bg-gray-100 text-gray-500",
  pending:      "bg-yellow-100 text-yellow-800",
  paid:         "bg-green-100 text-green-800",
  failed:       "bg-red-100 text-red-700",
  refunded:     "bg-purple-100 text-purple-700",
  waived:       "bg-blue-100 text-blue-700",
};

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) notFound();

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(
      "id, athlete_id, registration_status, payment_status, amount, currency, razorpay_order_id, razorpay_payment_id, registered_at, confirmed_at, athletes(full_name, athlete_id, verification_status)"
    )
    .eq("event_id", id)
    .order("registered_at", { ascending: false });

  const confirmedCount = registrations?.filter((r) => r.registration_status === "confirmed").length ?? 0;
  const pendingCount   = registrations?.filter((r) => r.registration_status === "pending").length ?? 0;
  const totalRevenue   = registrations
    ?.filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/events" className="hover:text-[#5B21B6]">Events</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{event.name}</span>
      </div>

      {/* Event header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{event.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2 text-xs md:text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" />{format(new Date(event.event_date), "dd MMM yyyy")}</span>
            <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{event.venue}, {event.district}</span></span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 shrink-0" />{event.sport} · {event.age_category}</span>
            <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 shrink-0" />{event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free"}</span>
          </div>
        </div>
        <Link href={`/events/${id}`} target="_blank" className="text-xs text-[#5B21B6] hover:underline font-medium shrink-0">
          View public page ↗
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Registrations", value: registrations?.length ?? 0 },
          { label: "Confirmed",           value: confirmedCount },
          { label: "Pending",             value: pendingCount },
          { label: "Revenue Collected",   value: totalRevenue > 0 ? `₹${totalRevenue.toLocaleString("en-IN")}` : "—" },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardBody className="py-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Registrations */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">
            Registrations ({registrations?.length ?? 0})
          </h2>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Athlete", "Athlete ID", "Reg Status", "Payment Status",
                  "Amount", "Razorpay Payment ID", "Registered At", "Confirmed At",
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {registrations?.map((reg) => {
                const athleteRaw = reg.athletes as unknown;
                const athlete = (Array.isArray(athleteRaw) ? athleteRaw[0] : athleteRaw) as { full_name: string; athlete_id: string; verification_status: string } | null;
                return (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{athlete?.full_name ?? "—"}</span>
                        {athlete && <VerificationBadge status={athlete.verification_status} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#5B21B6]">{athlete?.athlete_id ?? reg.athlete_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${REG_STATUS_COLORS[reg.registration_status] ?? "bg-gray-100 text-gray-600"}`}>
                        {reg.registration_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAY_STATUS_COLORS[reg.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                        {reg.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {reg.amount ? `₹${Number(reg.amount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {reg.razorpay_payment_id ? (
                        <span className="font-mono text-xs text-gray-600">{reg.razorpay_payment_id}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {format(new Date(reg.registered_at), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {reg.confirmed_at ? format(new Date(reg.confirmed_at), "dd MMM yyyy, HH:mm") : "—"}
                    </td>
                  </tr>
                );
              })}
              {!registrations?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-50">
          {registrations?.map((reg) => {
            const athleteRaw = reg.athletes as unknown;
            const athlete = (Array.isArray(athleteRaw) ? athleteRaw[0] : athleteRaw) as { full_name: string; athlete_id: string; verification_status: string } | null;
            return (
              <div key={reg.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {athlete?.full_name ?? "—"}
                    </p>
                    <p className="font-mono text-xs text-[#5B21B6] mt-0.5 truncate">
                      {athlete?.athlete_id ?? reg.athlete_id}
                    </p>
                  </div>
                  {athlete && <VerificationBadge status={athlete.verification_status} />}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${REG_STATUS_COLORS[reg.registration_status] ?? "bg-gray-100 text-gray-600"}`}>
                    {reg.registration_status}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PAY_STATUS_COLORS[reg.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                    {reg.payment_status}
                  </span>
                  {reg.amount && (
                    <span className="text-xs text-gray-700 font-medium">
                      ₹{Number(reg.amount).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Registered {format(new Date(reg.registered_at), "dd MMM yyyy, HH:mm")}
                </p>
                {reg.razorpay_payment_id && (
                  <p className="font-mono text-xs text-gray-400 truncate">
                    {reg.razorpay_payment_id}
                  </p>
                )}
              </div>
            );
          })}
          {!registrations?.length && (
            <div className="px-4 py-12 text-center text-gray-400 text-sm">
              No registrations yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
