import CreateEventForm from "@/components/forms/CreateEventForm";
import Link from "next/link";

export const metadata = { title: "Create Event | Admin" };

export default function CreateEventPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/admin/events" className="hover:text-[#5B21B6]">Events</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Event</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
      <CreateEventForm />
    </div>
  );
}
