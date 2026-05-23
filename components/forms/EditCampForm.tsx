"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { ODISHA_DISTRICTS, AGE_GROUPS } from "@/lib/constants";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface CampData {
  id: string;
  name: string;
  district: string;
  venue: string;
  camp_date: string;
  start_time?: string | null;
  end_time?: string | null;
  age_groups: string[];
  description?: string | null;
  status: string;
}

export default function EditCampForm({ camp }: { camp: CampData }) {
  const [form, setForm] = useState({
    name: camp.name,
    district: camp.district,
    venue: camp.venue,
    camp_date: camp.camp_date,
    start_time: camp.start_time ?? "",
    end_time: camp.end_time ?? "",
    age_groups: camp.age_groups ?? [],
    description: camp.description ?? "",
    status: camp.status,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function toggleAgeGroup(ag: string) {
    setForm((prev) => ({
      ...prev,
      age_groups: prev.age_groups.includes(ag)
        ? prev.age_groups.filter((g) => g !== ag)
        : [...prev.age_groups, ag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.age_groups.length === 0) { setError("Select at least one age group."); return; }
    setLoading(true);

    const { error: updateError } = await supabase
      .from("camps")
      .update({
        name: form.name.trim(),
        district: form.district,
        venue: form.venue.trim(),
        camp_date: form.camp_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        age_groups: form.age_groups,
        description: form.description.trim() || null,
        status: form.status,
      })
      .eq("id", camp.id);

    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    router.push(`/admin/camps/${camp.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <Input label="Camp Name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
      <Input label="Sport" value="Football" disabled hint="Only Football camps are supported in Module 1." />
      <Select label="District *" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} required placeholder="Select district" options={ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }))} />
      <Input label="Venue *" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} required />
      <Input label="Camp Date *" type="date" value={form.camp_date} onChange={(e) => setForm((p) => ({ ...p, camp_date: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
        <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Age Groups *</p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((ag) => (
            <button key={ag} type="button" onClick={() => toggleAgeGroup(ag)}
              className={["px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                form.age_groups.includes(ag)
                  ? "bg-[#5B21B6] text-white border-[#5B21B6]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#5B21B6] hover:text-[#5B21B6]",
              ].join(" ")}>{ag}</button>
          ))}
        </div>
      </div>
      <Textarea label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
      <Select label="Status" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} options={STATUS_OPTIONS} />
      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1" size="lg">Save Changes</Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
