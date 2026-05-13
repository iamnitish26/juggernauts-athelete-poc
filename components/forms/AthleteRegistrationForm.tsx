"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SPORTS, ODISHA_DISTRICTS, AGE_GROUPS, GENDERS, isMinor } from "@/lib/constants";
import { CheckCircle, ChevronRight, ChevronLeft, Upload } from "lucide-react";

type FormStep = "basic" | "sport" | "contact" | "achievements" | "consent";

const STEPS: { key: FormStep; label: string }[] = [
  { key: "basic", label: "Basic Details" },
  { key: "sport", label: "Sport Info" },
  { key: "contact", label: "Contact" },
  { key: "achievements", label: "Achievements" },
  { key: "consent", label: "Consent" },
];

const SPORT_OPTIONS = SPORTS.map((s) => ({ value: s.id, label: s.name }));
const DISTRICT_OPTIONS = ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }));
const AGE_OPTIONS = AGE_GROUPS.map((a) => ({ value: a, label: a }));
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g.value, label: g.label }));

interface FormData {
  full_name: string;
  gender: string;
  date_of_birth: string;
  age_group: string;
  state: string;
  district: string;
  city_block: string;
  photo_consent: boolean;
  primary_sport: string;
  sport_id: string;
  position_event_category: string;
  dominant_side: string;
  current_club_school: string;
  years_of_experience: string;
  athlete_phone: string;
  athlete_email: string;
  guardian_name: string;
  guardian_phone: string;
  achievement_summary: string;
  video_link: string;
  instagram_link: string;
  data_consent: boolean;
  guardian_consent: boolean;
}

const initialForm: FormData = {
  full_name: "",
  gender: "",
  date_of_birth: "",
  age_group: "",
  state: "Odisha",
  district: "",
  city_block: "",
  photo_consent: false,
  primary_sport: "",
  sport_id: "",
  position_event_category: "",
  dominant_side: "",
  current_club_school: "",
  years_of_experience: "",
  athlete_phone: "",
  athlete_email: "",
  guardian_name: "",
  guardian_phone: "",
  achievement_summary: "",
  video_link: "",
  instagram_link: "",
  data_consent: false,
  guardian_consent: false,
};

export default function AthleteRegistrationForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdAthleteId, setCreatedAthleteId] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const currentStep = STEPS[step];
  const minor = form.date_of_birth ? isMinor(form.date_of_birth) : false;

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-derive age group from DOB
      if (field === "date_of_birth" && value) {
        const age = getAge(value as string);
        next.age_group = deriveAgeGroup(age);
      }
      // Auto-set sport_id when primary_sport changes
      if (field === "primary_sport") {
        const sport = SPORTS.find((s) => s.id === value);
        next.sport_id = sport?.id ?? "";
        next.primary_sport = sport?.name ?? "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function getAge(dob: string) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    )
      age--;
    return age;
  }

  function deriveAgeGroup(age: number): string {
    if (age < 13) return "U-13";
    if (age < 15) return "U-15";
    if (age < 17) return "U-17";
    if (age < 19) return "U-19";
    return "Senior";
  }

  function validateStep(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (currentStep.key === "basic") {
      if (!form.full_name.trim()) e.full_name = "Full name is required";
      if (!form.gender) e.gender = "Please select gender";
      if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
      if (!form.district) e.district = "Please select your district";
    }

    if (currentStep.key === "sport") {
      if (!form.primary_sport) e.primary_sport = "Please select a sport";
    }

    if (currentStep.key === "contact" && minor) {
      if (!form.guardian_name.trim()) e.guardian_name = "Guardian name is required for minors";
      if (!form.guardian_phone.trim()) e.guardian_phone = "Guardian phone is required for minors";
    }

    if (currentStep.key === "consent") {
      if (!form.data_consent) {
        setSubmitError("You must agree to data usage consent to proceed.");
        return false;
      }
      if (minor && !form.guardian_consent) {
        setSubmitError("Guardian consent is required for athletes under 18.");
        return false;
      }
    }

    setErrors(e as Partial<FormData>);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setSubmitError("");

    try {
      // Upload profile photo if provided
      let profilePhotoUrl: string | null = null;
      if (profilePhoto && form.photo_consent) {
        const ext = profilePhoto.name.split(".").pop();
        const path = `athletes/${userId}/profile.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("athlete-media")
          .upload(path, profilePhoto, { upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from("athlete-media").getPublicUrl(path);
          profilePhotoUrl = data.publicUrl;
        }
      }

      // Upload certificate if provided
      let certificateUrl: string | null = null;
      if (certificate) {
        const ext = certificate.name.split(".").pop();
        const path = `athletes/${userId}/certificate.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("athlete-media")
          .upload(path, certificate, { upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from("athlete-media").getPublicUrl(path);
          certificateUrl = data.publicUrl;
        }
      }

      // Get next sequence number via RPC and build athlete ID
      const sport = SPORTS.find((s) => s.id === form.sport_id);
      const sportCode = sport?.code ?? "OT";
      const year = new Date().getFullYear();

      const { data: seqData, error: seqError } = await supabase.rpc(
        "next_athlete_sequence",
        { p_sport_code: sportCode, p_year: year }
      );

      if (seqError) throw new Error(seqError.message);

      const seq = String(seqData).padStart(6, "0");
      const athleteId = `JG-OD-${sportCode}-${year}-${seq}`;

      // Insert athlete record
      const { data: athlete, error: insertError } = await supabase
        .from("athletes")
        .insert({
          user_id: userId,
          athlete_id: athleteId,
          full_name: form.full_name.trim(),
          gender: form.gender,
          date_of_birth: form.date_of_birth,
          age_group: form.age_group || deriveAgeGroup(getAge(form.date_of_birth)),
          state: form.state,
          district: form.district,
          city_block: form.city_block || null,
          profile_photo_url: profilePhotoUrl,
          photo_consent: form.photo_consent,
          primary_sport: form.primary_sport,
          sport_id: form.sport_id || null,
          position_event_category: form.position_event_category || null,
          dominant_side: form.dominant_side || null,
          current_club_school: form.current_club_school || null,
          years_of_experience: form.years_of_experience ? parseInt(form.years_of_experience) : null,
          athlete_phone: form.athlete_phone || null,
          athlete_email: form.athlete_email || null,
          guardian_name: minor ? form.guardian_name || null : null,
          guardian_phone: minor ? form.guardian_phone || null : null,
          achievement_summary: form.achievement_summary || null,
          certificate_url: certificateUrl,
          video_link: form.video_link || null,
          instagram_link: form.instagram_link || null,
          data_consent: form.data_consent,
          guardian_consent: minor ? form.guardian_consent : null,
          verification_status: "self_registered",
        })
        .select("id, athlete_id")
        .single();

      if (insertError) throw new Error(insertError.message);

      setCreatedAthleteId(athlete.athlete_id);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  // Success screen
  if (createdAthleteId) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Athlete ID Created!
        </h2>
        <p className="text-gray-600 mb-4">
          Your profile has been registered successfully.
        </p>
        <div className="bg-[#F5F3FF] border border-purple-200 rounded-2xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Your Athlete ID</p>
          <p className="font-mono text-xl font-bold text-[#5B21B6]">
            {createdAthleteId}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Save this ID — you&apos;ll need it for events
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Status: <span className="font-semibold text-yellow-700">Self Registered</span>
          <br />
          A Juggernauts volunteer will review and verify your profile.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => router.push(`/athlete/${createdAthleteId}`)}
            className="w-full"
          >
            View My Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/events")}
            className="w-full"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  i < step
                    ? "bg-[#5B21B6] text-white"
                    : i === step
                    ? "bg-[#7C3AED] text-white ring-4 ring-purple-100"
                    : "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-colors ${
                    i < step ? "bg-[#5B21B6]" : "bg-gray-200"
                  }`}
                  style={{ width: "calc((100% - 40px) / 4)" }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold text-[#5B21B6]">
          Step {step + 1} of {STEPS.length}: {currentStep.label}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* BASIC DETAILS */}
        {currentStep.key === "basic" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Details</h2>
            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              required
              placeholder="Arjun Pradhan"
              error={errors.full_name}
            />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              required
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              error={errors.gender}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
              error={errors.date_of_birth}
            />
            {form.date_of_birth && (
              <Select
                label="Age Group"
                value={form.age_group}
                onChange={(e) => update("age_group", e.target.value)}
                options={AGE_OPTIONS}
                placeholder="Select age group"
                hint="Auto-derived from your date of birth"
              />
            )}
            <Input
              label="State"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              hint="Defaulting to Odisha"
            />
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
              label="City / Block / Village"
              value={form.city_block}
              onChange={(e) => update("city_block", e.target.value)}
              placeholder="e.g. Cuttack City, Badamba Block"
            />
            {/* Profile photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="profile-photo"
                onChange={(e) => setProfilePhoto(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="profile-photo"
                className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-purple-300 transition-colors"
              >
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {profilePhoto ? profilePhoto.name : "Click to upload photo"}
                </span>
              </label>
              {profilePhoto && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="photo-consent"
                    checked={form.photo_consent}
                    onChange={(e) => update("photo_consent", e.target.checked)}
                    className="rounded text-[#5B21B6]"
                  />
                  <label htmlFor="photo-consent" className="text-xs text-gray-600">
                    I consent to my photo being shown on my public profile
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPORT INFO */}
        {currentStep.key === "sport" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sport Information</h2>
            <Select
              label="Primary Sport"
              value={form.sport_id}
              onChange={(e) => update("primary_sport", e.target.value)}
              required
              options={SPORT_OPTIONS}
              placeholder="Select your sport"
              error={errors.primary_sport}
            />
            <Input
              label="Position / Event Category"
              value={form.position_event_category}
              onChange={(e) => update("position_event_category", e.target.value)}
              placeholder="e.g. Forward, Sprinter, All-rounder"
              hint="Your playing position or event specialty"
            />
            <Input
              label="Dominant Foot / Hand"
              value={form.dominant_side}
              onChange={(e) => update("dominant_side", e.target.value)}
              placeholder="e.g. Right foot, Left hand"
              hint="Where applicable (football, cricket, badminton etc.)"
            />
            <Input
              label="Current Club / Academy / School / College"
              value={form.current_club_school}
              onChange={(e) => update("current_club_school", e.target.value)}
              placeholder="e.g. Cuttack FC Academy, SAI Bhubaneswar"
            />
            <Input
              label="Years of Playing Experience"
              type="number"
              min={0}
              max={30}
              value={form.years_of_experience}
              onChange={(e) => update("years_of_experience", e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
        )}

        {/* CONTACT */}
        {currentStep.key === "contact" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Details</h2>
            <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
              Contact details are private and will never appear on your public profile.
            </p>
            <Input
              label="Athlete Phone"
              type="tel"
              value={form.athlete_phone}
              onChange={(e) => update("athlete_phone", e.target.value)}
              placeholder="+91 98765 43210"
              hint="Optional"
            />
            <Input
              label="Athlete Email"
              type="email"
              value={form.athlete_email}
              onChange={(e) => update("athlete_email", e.target.value)}
              placeholder="athlete@example.com"
              hint="Optional"
            />

            {minor && (
              <div className="mt-2 space-y-4 pt-4 border-t border-orange-100">
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-orange-800 font-medium">
                    Guardian details required — athlete appears to be under 18
                  </p>
                </div>
                <Input
                  label="Guardian Name"
                  value={form.guardian_name}
                  onChange={(e) => update("guardian_name", e.target.value)}
                  required
                  placeholder="Parent or guardian's full name"
                  error={errors.guardian_name}
                />
                <Input
                  label="Guardian Phone"
                  type="tel"
                  value={form.guardian_phone}
                  onChange={(e) => update("guardian_phone", e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  error={errors.guardian_phone}
                />
              </div>
            )}
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {currentStep.key === "achievements" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements</h2>
            <Textarea
              label="Achievement Summary"
              value={form.achievement_summary}
              onChange={(e) => update("achievement_summary", e.target.value)}
              placeholder="e.g. District level gold medalist 2023, State U-17 selection camp participant, Best Player award 2022"
              hint="Briefly describe your sports achievements and milestones"
            />
            {/* Certificate upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Upload <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                id="certificate"
                onChange={(e) => setCertificate(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="certificate"
                className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-purple-300 transition-colors"
              >
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {certificate ? certificate.name : "Upload certificate or award (PDF/image)"}
                </span>
              </label>
            </div>
            <Input
              label="Video Link"
              type="url"
              value={form.video_link}
              onChange={(e) => update("video_link", e.target.value)}
              placeholder="https://youtube.com/..."
              hint="Highlights or training video (optional)"
            />
            <Input
              label="Instagram / Social Profile"
              value={form.instagram_link}
              onChange={(e) => update("instagram_link", e.target.value)}
              placeholder="@yourusername or profile link"
              hint="Optional"
            />
          </div>
        )}

        {/* CONSENT */}
        {currentStep.key === "consent" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Consent</h2>

            <div className="bg-[#F5F3FF] rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-[#3B0764] mb-2">Data Usage Policy</p>
              <p>
                Your information will be used to create and manage your athlete
                profile on the Juggernauts platform. Private data (phone, email,
                guardian details, date of birth) will never be shown publicly.
                Your public profile will only show your name, sport, district,
                age group, and achievements.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.data_consent}
                  onChange={(e) => update("data_consent", e.target.checked)}
                  className="mt-0.5 rounded text-[#5B21B6]"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">Data Usage Consent *</span> — I consent to
                  Juggernauts collecting and using my information for sports
                  profiling, event registration, and talent discovery purposes.
                </span>
              </label>

              {form.photo_consent && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.photo_consent}
                    onChange={(e) => update("photo_consent", e.target.checked)}
                    className="mt-0.5 rounded text-[#5B21B6]"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">Media Consent</span> — I consent to
                    my profile photo being displayed publicly on my athlete profile.
                  </span>
                </label>
              )}

              {minor && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.guardian_consent}
                    onChange={(e) => update("guardian_consent", e.target.checked)}
                    className="mt-0.5 rounded text-[#5B21B6]"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">Guardian Consent *</span> — As the
                    parent/guardian of this athlete, I consent to their profile being
                    created on the Juggernauts platform.
                  </span>
                </label>
              )}
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} className="flex items-center gap-1">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Submit Registration
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
