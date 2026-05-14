"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Edit3, X, Save } from "lucide-react";

interface Athlete {
  id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  age_group: string;
  state: string;
  district: string;
  city_block: string | null;
  primary_sport: string;
  position_event_category: string | null;
  dominant_side: string | null;
  current_club_school: string | null;
  years_of_experience: number | null;
  achievement_summary: string | null;
  instagram_link: string | null;
  video_link: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relationship: string | null;
  athlete_phone: string | null;
  athlete_email: string | null;
}

interface Props {
  athlete: Athlete;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const DOMINANT_SIDE_OPTIONS = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "both", label: "Both" },
  { value: "not_applicable", label: "Not Applicable" },
];

const GUARDIAN_RELATIONSHIP_OPTIONS = [
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Relative" },
  { value: "coach", label: "Coach" },
  { value: "other", label: "Other" },
];

export default function AdminAthleteEditForm({ athlete }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: athlete.full_name ?? "",
    gender: athlete.gender ?? "",
    date_of_birth: athlete.date_of_birth ?? "",
    age_group: athlete.age_group ?? "",
    state: athlete.state ?? "",
    district: athlete.district ?? "",
    city_block: athlete.city_block ?? "",
    primary_sport: athlete.primary_sport ?? "",
    position_event_category: athlete.position_event_category ?? "",
    dominant_side: athlete.dominant_side ?? "",
    current_club_school: athlete.current_club_school ?? "",
    years_of_experience: athlete.years_of_experience?.toString() ?? "",
    achievement_summary: athlete.achievement_summary ?? "",
    instagram_link: athlete.instagram_link ?? "",
    video_link: athlete.video_link ?? "",
    guardian_name: athlete.guardian_name ?? "",
    guardian_phone: athlete.guardian_phone ?? "",
    guardian_relationship: athlete.guardian_relationship ?? "",
    athlete_phone: athlete.athlete_phone ?? "",
    athlete_email: athlete.athlete_email ?? "",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
      disabled: !editing,
    };
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("athletes")
      .update({
        full_name: form.full_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        age_group: form.age_group,
        state: form.state,
        district: form.district,
        city_block: form.city_block || null,
        primary_sport: form.primary_sport,
        position_event_category: form.position_event_category || null,
        dominant_side: form.dominant_side || null,
        current_club_school: form.current_club_school || null,
        years_of_experience: form.years_of_experience
          ? parseInt(form.years_of_experience, 10)
          : null,
        achievement_summary: form.achievement_summary || null,
        instagram_link: form.instagram_link || null,
        video_link: form.video_link || null,
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        guardian_relationship: form.guardian_relationship || null,
        athlete_phone: form.athlete_phone || null,
        athlete_email: form.athlete_email || null,
      })
      .eq("id", athlete.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess("Profile updated successfully.");
    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  function handleCancel() {
    setForm({
      full_name: athlete.full_name ?? "",
      gender: athlete.gender ?? "",
      date_of_birth: athlete.date_of_birth ?? "",
      age_group: athlete.age_group ?? "",
      state: athlete.state ?? "",
      district: athlete.district ?? "",
      city_block: athlete.city_block ?? "",
      primary_sport: athlete.primary_sport ?? "",
      position_event_category: athlete.position_event_category ?? "",
      dominant_side: athlete.dominant_side ?? "",
      current_club_school: athlete.current_club_school ?? "",
      years_of_experience: athlete.years_of_experience?.toString() ?? "",
      achievement_summary: athlete.achievement_summary ?? "",
      instagram_link: athlete.instagram_link ?? "",
      video_link: athlete.video_link ?? "",
      guardian_name: athlete.guardian_name ?? "",
      guardian_phone: athlete.guardian_phone ?? "",
      guardian_relationship: athlete.guardian_relationship ?? "",
      athlete_phone: athlete.athlete_phone ?? "",
      athlete_email: athlete.athlete_email ?? "",
    });
    setEditing(false);
    setError("");
  }

  return (
    <div className="space-y-6">
      {/* Edit toggle */}
      <div className="flex items-center justify-between">
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} loading={loading}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Changes
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
          {success}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
          {error}
        </p>
      )}

      {/* Personal */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Personal Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" {...field("full_name")} />
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            {...field("gender")}
          />
          <Input label="Date of Birth" type="date" {...field("date_of_birth")} />
          <Input label="Age Group" {...field("age_group")} hint="e.g. U-14, U-17, Senior" />
          <Input label="State" {...field("state")} />
          <Input label="District" {...field("district")} />
          <Input label="City / Block" {...field("city_block")} />
        </div>
      </div>

      {/* Sport */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Sport Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Primary Sport" {...field("primary_sport")} />
          <Input label="Position / Event" {...field("position_event_category")} />
          <Select
            label="Dominant Side"
            options={DOMINANT_SIDE_OPTIONS}
            placeholder="Select dominant side"
            {...field("dominant_side")}
          />
          <Input label="Club / School" {...field("current_club_school")} />
          <Input
            label="Years of Experience"
            type="number"
            min="0"
            max="30"
            {...field("years_of_experience")}
          />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Achievements &amp; Media
        </h3>
        <div className="space-y-4">
          <Textarea
            label="Achievement Summary"
            rows={4}
            {...field("achievement_summary")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Instagram Handle / Link" {...field("instagram_link")} />
            <Input label="Highlight Video URL" {...field("video_link")} />
          </div>
        </div>
      </div>

      {/* Contact (private) */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Contact Details
        </h3>
        <p className="text-xs text-red-600 mb-3">Private — never shown publicly</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Athlete Phone" {...field("athlete_phone")} />
          <Input label="Athlete Email" type="email" {...field("athlete_email")} />
          <Input label="Guardian Name" {...field("guardian_name")} />
          <Input label="Guardian Phone" {...field("guardian_phone")} />
          <Select
            label="Guardian Relationship"
            options={GUARDIAN_RELATIONSHIP_OPTIONS}
            placeholder="Select relationship"
            {...field("guardian_relationship")}
          />
        </div>
      </div>
    </div>
  );
}
