import CreateEventForm from "@/components/forms/CreateEventForm";

export const metadata = { title: "Create Event | Admin" };

export default function CreateEventPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
      <CreateEventForm />
    </div>
  );
}
