import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateEventForm from "@/components/forms/CreateEventForm";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Edit Event | Admin" };

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) notFound();

  // Map DB row to form shape
  const initialData = {
    name:                       event.name ?? "",
    sport:                      event.sport ?? "",
    age_category:               event.age_category ?? "",
    event_type:                 (event.event_type ?? (event.registration_fee > 0 ? "paid" : "free")) as "free" | "paid",
    event_date:                 event.event_date ?? "",
    start_time:                 event.start_time ?? "",
    end_time:                   event.end_time ?? "",
    registration_deadline:      event.registration_deadline ?? "",
    venue:                      event.venue ?? "",
    district:                   event.district ?? "",
    google_maps_link:           event.google_maps_link ?? "",
    registration_fee:           String(event.registration_fee ?? 0),
    max_participants:           event.max_participants ? String(event.max_participants) : "",
    registration_format:        (event.registration_format ?? "individual") as "individual" | "team",
    registration_approval_mode: (event.registration_approval_mode ?? "auto") as "auto" | "manual",
    description:                event.description ?? "",
    eligibility_criteria:       event.eligibility_criteria ?? "",
    required_documents_notes:   event.required_documents_notes ?? "",
    organiser_name:             event.organiser_name ?? "Juggernauts",
    organiser_contact_email:    event.organiser_contact_email ?? "",
    organiser_contact_phone:    event.organiser_contact_phone ?? "",
    status:                     event.status ?? "draft",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/events" className="hover:text-[#5B21B6]">Events</Link>
        <span>/</span>
        <Link href={`/admin/events/${id}`} className="hover:text-[#5B21B6] truncate max-w-[200px]">
          {event.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>
      <CreateEventForm initialData={initialData} eventId={id} />
    </div>
  );
}
