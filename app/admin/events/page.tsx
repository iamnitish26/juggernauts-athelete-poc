import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export const metadata = { title: "Events | Admin" };

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-800",
};

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*, event_registrations(count)")
    .order("event_date", { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events?.length ?? 0} events</p>
        </div>
        <Link href="/admin/events/new">
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Event", "Sport", "Date", "District", "Fee", "Registrations", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events?.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-sm text-gray-900">{event.name}</p>
                    <p className="text-xs text-gray-400">{event.age_category}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{event.sport}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {format(new Date(event.event_date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{event.district}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {event.registration_fee > 0 ? `₹${event.registration_fee}` : "Free"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(event.event_registrations as { count: number }[])?.[0]?.count ?? 0}
                    {event.max_participants && ` / ${event.max_participants}`}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      color={STATUS_COLORS[event.status]}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-xs text-[#5B21B6] hover:underline font-medium"
                      >
                        Registrations
                      </Link>
                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:underline"
                      >
                        Public ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!events?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No events yet.{" "}
                    <Link href="/admin/events/new" className="text-[#5B21B6] hover:underline">
                      Create one
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
