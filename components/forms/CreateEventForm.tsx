"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SPORTS, ODISHA_DISTRICTS, AGE_GROUPS } from "@/lib/constants";
import { CheckCircle } from "lucide-react";

const SPORT_OPTIONS = SPORTS.map((s) => ({ value: s.name, label: s.name }));
const DISTRICT_OPTIONS = ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }));
const AGE_OPTIONS = [
  ...AGE_GROUPS.map((a) => ({ value: a, label: a })),
  { value: "Open", label: "Open (All Ages)" },
];

type FormData = {
  name: string;
  sport: string;
  age_category: string;
  event_type: "free" | "paid";
  event_date: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  venue: string;
  district: string;
  google_maps_link: string;
  registration_fee: string;
  max_participants: string;
  registration_format: "individual" | "team";
  registration_approval_mode: "auto" | "manual";
  description: string;
  eligibility_criteria: string;
  required_documents_notes: string;
  organiser_name: string;
  organiser_contact_email: string;
  organiser_contact_phone: string;
  status: string;
};

const DEFAULT_FORM: FormData = {
  name: "",
  sport: "",
  age_category: "",
  event_type: "free",
  event_date: "",
  start_time: "",
  end_time: "",
  registration_deadline: "",
  venue: "",
  district: "",
  google_maps_link: "",
  registration_fee: "0",
  max_participants: "",
  registration_format: "individual",
  registration_approval_mode: "auto",
  description: "",
  eligibility_criteria: "",
  required_documents_notes: "",
  organiser_name: "Juggernauts",
  organiser_contact_email: "",
  organiser_contact_phone: "",
  status: "draft",
};

interface Props {
  initialData?: Partial<FormData>;
  eventId?: string; // present = edit mode
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-4 pb-1 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-[#5B21B6] uppercase tracking-wide">{title}</h3>
    </div>
  );
}

export default function CreateEventForm({ initialData, eventId }: Props) {
  const isEdit = !!eventId;
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function update<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim())               e.name = "Event name is required.";
    if (!form.sport)                     e.sport = "Sport is required.";
    if (!form.age_category)              e.age_category = "Age category is required.";
    if (!form.event_date)                e.event_date = "Event date is required.";
    if (!form.start_time)                e.start_time = "Start time is required.";
    if (!form.venue.trim())              e.venue = "Venue is required.";
    if (!form.district)                  e.district = "District is required.";
    if (!form.registration_deadline)     e.registration_deadline = "Registration deadline is required.";

    if (form.registration_deadline && form.event_date) {
      if (new Date(form.registration_deadline) > new Date(form.event_date)) {
        e.registration_deadline = "Registration deadline cannot be after the event date.";
      }
    }

    if (form.max_participants && (parseInt(form.max_participants) < 1 || isNaN(parseInt(form.max_participants)))) {
      e.max_participants = "Max participants must be a positive number.";
    }

    if (form.event_type === "paid") {
      const fee = parseFloat(form.registration_fee);
      if (isNaN(fee) || fee < 0) e.registration_fee = "Registration fee must be 0 or more.";
    }

    if (form.google_maps_link && !isValidUrl(form.google_maps_link)) {
      e.google_maps_link = "Enter a valid URL (e.g. https://maps.google.com/...)";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError("");

    const { data: { user } } = await supabase.auth.getUser();

    const { data: sport } = await supabase
      .from("sports")
      .select("id")
      .eq("name", form.sport)
      .single();

    const payload = {
      name: form.name.trim(),
      sport: form.sport,
      sport_id: sport?.id ?? null,
      age_category: form.age_category,
      event_type: form.event_type,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      registration_deadline: form.registration_deadline,
      venue: form.venue.trim(),
      district: form.district,
      google_maps_link: form.google_maps_link.trim() || null,
      registration_fee: form.event_type === "free" ? 0 : (parseFloat(form.registration_fee) || 0),
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      registration_format: form.registration_format,
      registration_approval_mode: form.registration_approval_mode,
      description: form.description.trim() || null,
      eligibility_criteria: form.eligibility_criteria.trim() || null,
      required_documents_notes: form.required_documents_notes.trim() || null,
      organiser_name: form.organiser_name.trim() || "Juggernauts",
      organiser_contact_email: form.organiser_contact_email.trim() || null,
      organiser_contact_phone: form.organiser_contact_phone.trim() || null,
      status: form.status,
    };

    if (isEdit) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", eventId);

      if (error) {
        setSubmitError(error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push(`/admin/events/${eventId}`), 1200);
    } else {
      const { data: created, error } = await supabase
        .from("events")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();

      if (error) {
        setSubmitError(error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push(`/admin/events/${created.id}`), 1200);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-800 font-semibold text-lg">
          {isEdit ? "Event updated!" : "Event created!"}
        </p>
        <p className="text-green-700 text-sm mt-1">Redirecting to event page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

      {/* ── Section 1: Basic Info ── */}
      <SectionHeader title="Event Basics" />

      <Input
        label="Event Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
        placeholder="e.g. Odisha U-17 Football Championship 2026"
        error={errors.name}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Sport"
          value={form.sport}
          onChange={(e) => update("sport", e.target.value)}
          required
          options={SPORT_OPTIONS}
          placeholder="Select sport"
          error={errors.sport}
        />
        <Select
          label="Age Category"
          value={form.age_category}
          onChange={(e) => update("age_category", e.target.value)}
          required
          options={AGE_OPTIONS}
          placeholder="Select age category"
          error={errors.age_category}
        />
      </div>

      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(["free", "paid"] as const).map((t) => (
            <label
              key={t}
              className={[
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors",
                form.event_type === t
                  ? "border-[#7C3AED] bg-purple-50 text-[#5B21B6]"
                  : "border-gray-200 text-gray-700 hover:border-gray-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="event_type"
                value={t}
                checked={form.event_type === t}
                onChange={() => {
                  update("event_type", t);
                  if (t === "free") update("registration_fee", "0");
                }}
                className="accent-[#7C3AED]"
              />
              <span className="text-sm font-medium capitalize">{t}</span>
            </label>
          ))}
        </div>
        {form.event_type === "paid" && (
          <p className="mt-2 text-xs text-gray-500">
            Paid events will require Razorpay payment before registration is confirmed.
          </p>
        )}
      </div>

      {/* ── Section 2: Date & Location ── */}
      <SectionHeader title="Date & Location" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Event Date"
          type="date"
          value={form.event_date}
          onChange={(e) => update("event_date", e.target.value)}
          required
          error={errors.event_date}
        />
        <Input
          label="Registration Deadline"
          type="date"
          value={form.registration_deadline}
          onChange={(e) => update("registration_deadline", e.target.value)}
          required
          error={errors.registration_deadline}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Event Start Time"
          type="time"
          value={form.start_time}
          onChange={(e) => update("start_time", e.target.value)}
          required
          error={errors.start_time}
        />
        <Input
          label="Event End Time"
          type="time"
          value={form.end_time}
          onChange={(e) => update("end_time", e.target.value)}
          hint="Optional"
        />
      </div>

      <Input
        label="Venue"
        value={form.venue}
        onChange={(e) => update("venue", e.target.value)}
        required
        placeholder="e.g. Kalinga Stadium, Bhubaneswar"
        error={errors.venue}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="District"
          value={form.district}
          onChange={(e) => update("district", e.target.value)}
          required
          options={DISTRICT_OPTIONS}
          placeholder="Select district"
          error={errors.district}
        />
        <Input
          label="Google Maps Link"
          type="url"
          value={form.google_maps_link}
          onChange={(e) => update("google_maps_link", e.target.value)}
          placeholder="https://maps.google.com/..."
          hint="Optional"
          error={errors.google_maps_link}
        />
      </div>

      {/* ── Section 3: Registration Settings ── */}
      <SectionHeader title="Registration Settings" />

      {form.event_type === "paid" && (
        <Input
          label="Registration Fee (₹)"
          type="number"
          min={0}
          step={1}
          value={form.registration_fee}
          onChange={(e) => update("registration_fee", e.target.value)}
          required
          hint="Whole INR amounts only"
          error={errors.registration_fee}
        />
      )}

      <Input
        label="Max Participants"
        type="number"
        min={1}
        value={form.max_participants}
        onChange={(e) => update("max_participants", e.target.value)}
        hint="Leave blank for unlimited"
        error={errors.max_participants}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Registration Format"
          value={form.registration_format}
          onChange={(e) => update("registration_format", e.target.value as "individual" | "team")}
          options={[
            { value: "individual", label: "Individual" },
            { value: "team",       label: "Team" },
          ]}
          hint={form.registration_format === "team" ? "TODO: Full team roster flow coming soon." : undefined}
        />
        <Select
          label="Registration Approval Mode"
          value={form.registration_approval_mode}
          onChange={(e) => update("registration_approval_mode", e.target.value as "auto" | "manual")}
          options={[
            { value: "auto",   label: "Auto-confirm after payment / free registration" },
            { value: "manual", label: "Manual approval required" },
          ]}
        />
      </div>

      {/* ── Section 4: Content ── */}
      <SectionHeader title="Event Content" />

      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="About this event, rules, format, prizes..."
      />

      <Textarea
        label="Eligibility Criteria"
        value={form.eligibility_criteria}
        onChange={(e) => update("eligibility_criteria", e.target.value)}
        placeholder="Example: U-17 athletes only. Guardian consent required for minors."
        hint="Shown to athletes on the event page."
      />

      <Textarea
        label="Required Documents / Notes"
        value={form.required_documents_notes}
        onChange={(e) => update("required_documents_notes", e.target.value)}
        placeholder="e.g. Bring original Athlete ID card. School ID for U-17 events."
      />

      {/* ── Section 5: Organiser ── */}
      <SectionHeader title="Organiser" />

      <Input
        label="Organiser Name"
        value={form.organiser_name}
        onChange={(e) => update("organiser_name", e.target.value)}
        placeholder="Juggernauts"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Contact Email"
          type="email"
          value={form.organiser_contact_email}
          onChange={(e) => update("organiser_contact_email", e.target.value)}
          placeholder="events@juggernauts.in"
        />
        <Input
          label="Contact Phone / WhatsApp"
          type="tel"
          value={form.organiser_contact_phone}
          onChange={(e) => update("organiser_contact_phone", e.target.value)}
          placeholder="+91 98765 43210"
        />
      </div>

      {/* ── Section 6: Settings ── */}
      <SectionHeader title="Settings" />

      <Select
        label="Status"
        value={form.status}
        onChange={(e) => update("status", e.target.value)}
        options={[
          { value: "draft",     label: "Draft (not public yet)" },
          { value: "open",      label: "Open for Registration" },
          { value: "closed",    label: "Closed" },
          { value: "completed", label: "Completed" },
        ]}
      />

      {/* Event banner placeholder */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-400 font-medium">Event Banner Image</p>
        <p className="text-xs text-gray-400 mt-1">
          {/* TODO: integrate with Supabase Storage when ready */}
          Image upload coming soon. Upload will be available once storage is configured.
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {isEdit ? "Update Event" : "Create Event"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}
