"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SPORTS, ODISHA_DISTRICTS, AGE_GROUPS } from "@/lib/constants";

const SPORT_OPTIONS = SPORTS.map((s) => ({ value: s.name, label: s.name }));
const DISTRICT_OPTIONS = ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }));
const AGE_OPTIONS = [
  ...AGE_GROUPS.map((a) => ({ value: a, label: a })),
  { value: "Open", label: "Open (All Ages)" },
];

export default function CreateEventForm() {
  const [form, setForm] = useState({
    name: "",
    sport: "",
    event_date: "",
    venue: "",
    district: "",
    age_category: "",
    registration_fee: "0",
    registration_deadline: "",
    max_participants: "",
    description: "",
    status: "draft",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: sport } = await supabase
      .from("sports")
      .select("id")
      .eq("name", form.sport)
      .single();

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        name: form.name.trim(),
        sport: form.sport,
        sport_id: sport?.id ?? null,
        event_date: form.event_date,
        venue: form.venue.trim(),
        district: form.district,
        age_category: form.age_category,
        registration_fee: parseFloat(form.registration_fee) || 0,
        registration_deadline: form.registration_deadline,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        description: form.description.trim() || null,
        status: form.status,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/events/${event.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <Input label="Event Name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. Odisha U-17 Football Championship 2026" />
      <Select label="Sport" value={form.sport} onChange={(e) => update("sport", e.target.value)} required options={SPORT_OPTIONS} placeholder="Select sport" />
      <Input label="Event Date" type="date" value={form.event_date} onChange={(e) => update("event_date", e.target.value)} required />
      <Input label="Venue" value={form.venue} onChange={(e) => update("venue", e.target.value)} required placeholder="e.g. Kalinga Stadium, Bhubaneswar" />
      <Select label="District" value={form.district} onChange={(e) => update("district", e.target.value)} required options={DISTRICT_OPTIONS} placeholder="Select district" />
      <Select label="Age Category" value={form.age_category} onChange={(e) => update("age_category", e.target.value)} required options={AGE_OPTIONS} placeholder="Select age category" />
      <Input label="Registration Fee (₹)" type="number" min={0} value={form.registration_fee} onChange={(e) => update("registration_fee", e.target.value)} hint="Enter 0 for free events" />
      <Input label="Registration Deadline" type="date" value={form.registration_deadline} onChange={(e) => update("registration_deadline", e.target.value)} required />
      <Input label="Max Participants" type="number" min={1} value={form.max_participants} onChange={(e) => update("max_participants", e.target.value)} hint="Leave blank for unlimited" />
      <Textarea label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="About this event, rules, format, prizes..." />
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
        options={[
          { value: "draft", label: "Draft (not public yet)" },
          { value: "open", label: "Open for Registration" },
          { value: "closed", label: "Closed" },
        ]}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          Create Event
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
