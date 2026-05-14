"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import {
  SPORTS,
  ODISHA_DISTRICTS,
  AGE_GROUPS,
  GENDERS,
  DOMINANT_SIDE_OPTIONS,
  GUARDIAN_RELATIONSHIP_OPTIONS,
  SPORT_POSITION_HINTS,
  isMinor,
} from "@/lib/constants";
import { CheckCircle, ChevronRight, ChevronLeft, Upload, Info } from "lucide-react";

const STEPS = [
  { key: "basic", label: "Basic Details" },
  { key: "sport", label: "Sport" },
  { key: "contact", label: "Contact" },
  { key: "achievements", label: "Achievements" },
  { key: "consent", label: "Consent" },
] as const;

type FormStep = (typeof STEPS)[number]["key"];

const SPORT_OPTIONS = SPORTS.map((s) => ({ value: s.id, label: s.name }));
const DISTRICT_OPTIONS = ODISHA_DISTRICTS.map((d) => ({ value: d, label: d }));
const AGE_GROUP_OPTIONS = AGE_GROUPS.map((a) => ({ value: a, label: a }));
const GENDER_OPTIONS = GENDERS.map((g) => ({ value: g.value, label: g.label }));
const DOMINANT_OPTIONS = DOMINANT_SIDE_OPTIONS.map((d) => ({ value: d.value, label: d.label }));
const RELATIONSHIP_OPTIONS = GUARDIAN_RELATIONSHIP_OPTIONS.map((r) => ({
  value: r.value,
  label: r.label,
}));

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
  other_sport: string;
  position_event_category: string;
  dominant_side: string;
  current_club_school: string;
  years_of_experience: string;
  athlete_phone: string;
  athlete_email: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  achievement_summary: string;
  video_link: string;
  instagram_link: string;
  data_consent: boolean;
  guardian_consent: boolean;
}

type FormErrors = Partial<Record<keyof FormData | "certificate", string>>;

function getAge(dob: string): number {
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

function validateIndianPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateCertificateFile(file: File): string | null {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (!validTypes.includes(file.type)) return "Invalid file type. Accepted: PDF, JPG, PNG.";
  if (file.size > 5 * 1024 * 1024) return "File too large. Maximum size: 5MB.";
  return null;
}

export default function AthleteRegistrationForm({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail?: string;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
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
    other_sport: "",
    position_event_category: "",
    dominant_side: "",
    current_club_school: "",
    years_of_experience: "",
    athlete_phone: "",
    athlete_email: userEmail ?? "",
    guardian_name: "",
    guardian_phone: "",
    guardian_relationship: "",
    achievement_summary: "",
    video_link: "",
    instagram_link: "",
    data_consent: false,
    guardian_consent: false,
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificateError, setCertificateError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
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
      if (field === "date_of_birth" && value) {
        next.age_group = deriveAgeGroup(getAge(value as string));
      }
      if (field === "primary_sport") {
        next.sport_id = value as string;
        if (value !== "other") next.other_sport = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateStep(): boolean {
    const e: FormErrors = {};
    setSubmitError("");

    if (currentStep.key === "basic") {
      if (!form.full_name.trim()) e.full_name = "Full name is required";
      if (!form.gender) e.gender = "Please select gender";
      if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
      if (!form.district) e.district = "Please select your district";
    }

    if (currentStep.key === "sport") {
      if (!form.primary_sport) e.primary_sport = "Please select a sport";
      if (form.primary_sport === "other" && !form.other_sport.trim())
        e.other_sport = "Please specify your sport";
      if (form.years_of_experience !== "") {
        const yoe = Number(form.years_of_experience);
        if (!Number.isInteger(yoe) || yoe < 0 || yoe > 30)
          e.years_of_experience = "Enter a whole number between 0 and 30";
      }
    }

    if (currentStep.key === "contact") {
      if (form.athlete_phone && !validateIndianPhone(form.athlete_phone))
        e.athlete_phone = "Enter a valid Indian mobile number (e.g. 9876543210)";
      if (minor) {
        if (!form.guardian_name.trim())
          e.guardian_name = "Guardian name is required for athletes under 18";
        if (!form.guardian_phone.trim())
          e.guardian_phone = "Guardian phone is required for athletes under 18";
        else if (!validateIndianPhone(form.guardian_phone))
          e.guardian_phone = "Enter a valid Indian mobile number";
        if (!form.guardian_relationship)
          e.guardian_relationship = "Please select guardian relationship";
      }
    }

    if (currentStep.key === "achievements") {
      if (form.video_link && !isValidUrl(form.video_link))
        e.video_link = "Enter a valid URL (must start with https://)";
      if (certificateError) e.certificate = certificateError;
    }

    if (currentStep.key === "consent") {
      if (!form.data_consent) {
        setSubmitError("You must agree to the data usage consent to submit.");
        return false;
      }
      if (minor && !form.guardian_consent) {
        setSubmitError("Guardian consent is required for athletes under 18.");
        return false;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setSubmitError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setSubmitError("");

    try {
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

      const sport = SPORTS.find((s) => s.id === form.sport_id);
      const sportCode = sport?.code ?? "OT";
      const sportName =
        form.sport_id === "other" && form.other_sport.trim()
          ? form.other_sport.trim()
          : sport?.name ?? "Other";

      const year = new Date().getFullYear();

      const { data: sportRow } = await supabase
        .from("sports")
        .select("id")
        .eq("code", sportCode)
        .single();
      const sportUuid = sportRow?.id ?? null;

      const { data: seqData, error: seqError } = await supabase.rpc(
        "next_athlete_sequence",
        { p_sport_code: sportCode, p_year: year }
      );
      if (seqError) throw new Error(seqError.message);

      const seq = String(seqData).padStart(6, "0");
      const athleteId = `JG-OD-${sportCode}-${year}-${seq}`;

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
          primary_sport: sportName,
          sport_id: sportUuid,
          position_event_category: form.position_event_category || null,
          dominant_side: form.dominant_side || null,
          current_club_school: form.current_club_school || null,
          years_of_experience: form.years_of_experience
            ? parseInt(form.years_of_experience)
            : null,
          athlete_phone: form.athlete_phone || null,
          athlete_email: form.athlete_email || null,
          guardian_name: minor ? form.guardian_name || null : null,
          guardian_phone: minor ? form.guardian_phone || null : null,
          guardian_relationship: minor ? form.guardian_relationship || null : null,
          achievement_summary: form.achievement_summary || null,
          certificate_url: certificateUrl,
          video_link: form.video_link || null,
          instagram_link: form.instagram_link || null,
          data_consent: form.data_consent,
          guardian_consent: minor ? form.guardian_consent : null,
          verification_status: "self_registered",
          profile_status: "pending",
          is_public: false,
        })
        .select("id, athlete_id")
        .single();

      if (insertError) throw new Error(insertError.message);

      setCreatedAthleteId(athlete.athlete_id);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
      setLoading(false);
    }
  }

  // --- Success screen ---
  if (createdAthleteId) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#F3E8FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#5B21B6]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Athlete ID Created!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your Juggernauts Athlete ID has been created successfully. Your athlete profile has
            been submitted for admin review.
          </p>
        </div>

        <div className="bg-[#F5F3FF] border border-purple-200 rounded-2xl p-5 mb-5 text-center">
          <p className="text-xs text-gray-500 mb-1">Your Athlete ID</p>
          <p className="font-mono text-2xl font-bold text-[#5B21B6] tracking-wide">
            {createdAthleteId}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Save this ID. You&apos;ll need it for event registrations and future profile updates.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Public Profile</p>
            <p className="text-sm font-semibold text-amber-700">Pending Approval</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Verification</p>
            <p className="text-sm font-semibold text-yellow-700">Self Registered</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#5B21B6]" />
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Juggernauts admin reviews your profile details.",
              "Incorrect, unsafe, duplicate, or inappropriate details may be edited or rejected.",
              "Once approved, your public profile will be available to share.",
              "A Juggernauts volunteer may verify your profile later.",
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#5B21B6] shrink-0 font-medium">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/athlete/${createdAthleteId}`)}
            className="w-full"
          >
            Check Profile Status
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/events")}
            className="w-full"
          >
            Browse Events
          </Button>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-gray-600 text-center py-1"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const positionHint =
    SPORT_POSITION_HINTS[form.primary_sport] ?? "Your playing position or event specialty";

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Desktop step indicator */}
      <div className="hidden sm:flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={i < STEPS.length - 1 ? "flex items-start flex-1" : "flex items-start"}
          >
            <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
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
              <span
                className={`text-xs mt-1 font-medium text-center leading-tight ${
                  i <= step ? "text-[#5B21B6]" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mt-4 transition-colors ${
                  i < step ? "bg-[#5B21B6]" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile step indicator */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-[#5B21B6]">
            Step {step + 1} of {STEPS.length}: {currentStep.label}
          </p>
          <p className="text-xs text-gray-400">
            {Math.round(((step + 1) / STEPS.length) * 100)}%
          </p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-[#5B21B6] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* === STEP 1: BASIC DETAILS === */}
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

            <div>
              <Input
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
                required
                max={new Date().toISOString().split("T")[0]}
                error={errors.date_of_birth}
              />
              {!errors.date_of_birth && (
                <p className="mt-1 text-xs text-gray-500">
                  Date of birth is used to calculate age group and event eligibility. It will not
                  appear on your public profile.
                </p>
              )}
              {form.date_of_birth && minor && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-800 font-medium">
                    This athlete is under 18. Guardian details and consent will be required before
                    submission.
                  </p>
                </div>
              )}
            </div>

            {form.date_of_birth && (
              <Select
                label="Age Group"
                value={form.age_group}
                onChange={(e) => update("age_group", e.target.value)}
                options={AGE_GROUP_OPTIONS}
                placeholder="Select age group"
                hint="Auto-derived from date of birth. You can adjust if needed."
              />
            )}

            <Input
              label="State"
              value={form.state}
              readOnly
              hint="Defaulting to Odisha"
              className="bg-gray-50 text-gray-500"
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
              hint="Enter your city, block, village, or locality within the selected district."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
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
              <p className="mt-1 text-xs text-gray-500">
                Profile photo is only shown publicly if media / photo consent is given.
              </p>
              {profilePhoto && (
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.photo_consent}
                    onChange={(e) => update("photo_consent", e.target.checked)}
                    className="mt-0.5 rounded text-[#5B21B6]"
                  />
                  <span className="text-xs text-gray-600">
                    I consent to my photo being shown on my public profile
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* === STEP 2: SPORT INFORMATION === */}
        {currentStep.key === "sport" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sport Information</h2>

            <Select
              label="Primary Sport"
              value={form.primary_sport}
              onChange={(e) => update("primary_sport", e.target.value)}
              required
              options={SPORT_OPTIONS}
              placeholder="Select your sport"
              error={errors.primary_sport}
            />

            {form.primary_sport === "other" && (
              <Input
                label="Please specify your sport"
                value={form.other_sport}
                onChange={(e) => update("other_sport", e.target.value)}
                required
                placeholder="e.g. Kho-Kho, Mallakhamb, Silambam"
                error={errors.other_sport}
              />
            )}

            <Input
              label="Position / Event Category"
              value={form.position_event_category}
              onChange={(e) => update("position_event_category", e.target.value)}
              placeholder="e.g. Forward, Sprinter, All-rounder"
              hint={form.primary_sport ? positionHint : "Select a sport first to see examples"}
            />

            <Select
              label="Dominant Foot / Hand"
              value={form.dominant_side}
              onChange={(e) => update("dominant_side", e.target.value)}
              options={DOMINANT_OPTIONS}
              placeholder="Select where applicable"
              hint="Where applicable (football, cricket, badminton etc.)"
            />

            <Input
              label="Current Club / Academy / School / College"
              value={form.current_club_school}
              onChange={(e) => update("current_club_school", e.target.value)}
              placeholder="e.g. Cuttack FC Academy, SAI Bhubaneswar"
              hint="Enter your current club, academy, school, college, or training group. Leave blank if not applicable."
            />

            <Input
              label="Years of Playing Experience"
              type="number"
              min={0}
              max={30}
              value={form.years_of_experience}
              onChange={(e) => update("years_of_experience", e.target.value)}
              placeholder="e.g. 4"
              hint="Approximate number of years you have been actively playing or training."
              error={errors.years_of_experience}
            />
          </div>
        )}

        {/* === STEP 3: CONTACT DETAILS === */}
        {currentStep.key === "contact" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Details</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <p className="text-xs text-blue-800 font-medium">
                Contact details are private and will never appear on your public profile.
              </p>
            </div>

            {minor && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Guardian details are required</span> because this
                  athlete is under 18. A parent or legal guardian should review and approve this
                  registration.
                </p>
              </div>
            )}

            <div>
              <Input
                label="Athlete Phone"
                type="tel"
                value={form.athlete_phone}
                onChange={(e) => update("athlete_phone", e.target.value)}
                placeholder="9876543210"
                error={errors.athlete_phone}
              />
              {!errors.athlete_phone && (
                <p className="mt-1 text-xs text-gray-500">
                  Example: 9876543210 or +91 9876543210
                </p>
              )}
            </div>

            <div>
              <Input
                label="Athlete Email"
                type="email"
                value={form.athlete_email}
                onChange={(e) => update("athlete_email", e.target.value)}
                placeholder="athlete@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                This can be different from the login email if a parent or guardian created the
                account.
              </p>
            </div>

            {minor && (
              <div className="space-y-4 pt-3 border-t border-orange-100">
                <Input
                  label="Guardian Name"
                  value={form.guardian_name}
                  onChange={(e) => update("guardian_name", e.target.value)}
                  required
                  placeholder="Parent or guardian's full name"
                  error={errors.guardian_name}
                />

                <div>
                  <Input
                    label="Guardian Phone"
                    type="tel"
                    value={form.guardian_phone}
                    onChange={(e) => update("guardian_phone", e.target.value)}
                    required
                    placeholder="9876543210"
                    error={errors.guardian_phone}
                  />
                  {!errors.guardian_phone && (
                    <p className="mt-1 text-xs text-gray-500">
                      Example: 9876543210 or +91 9876543210
                    </p>
                  )}
                </div>

                <Select
                  label="Guardian Relationship"
                  value={form.guardian_relationship}
                  onChange={(e) => update("guardian_relationship", e.target.value)}
                  required
                  options={RELATIONSHIP_OPTIONS}
                  placeholder="Select relationship"
                  error={errors.guardian_relationship}
                />
              </div>
            )}
          </div>
        )}

        {/* === STEP 4: ACHIEVEMENTS === */}
        {currentStep.key === "achievements" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements</h2>

            {/* TODO: Future — auto-generate player bio from achievement_summary using AI */}
            <Textarea
              label="Achievement Summary"
              value={form.achievement_summary}
              onChange={(e) => update("achievement_summary", e.target.value)}
              placeholder="Example: Played district school football tournament in 2025. Selected for U-15 academy camp. Scored 4 goals in local league."
              hint="Mention tournaments played, awards, trials, camps, teams represented, or personal milestones."
            />
            <p className="text-xs text-gray-400 -mt-2">
              No formal achievements yet? You can mention training experience, tournaments
              participated in, or leave this blank for now.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificate Upload{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                className="hidden"
                id="certificate"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setCertificate(file);
                  if (file) {
                    const err = validateCertificateFile(file);
                    setCertificateError(err ?? "");
                    setErrors((prev) => ({ ...prev, certificate: err ?? "" }));
                  } else {
                    setCertificateError("");
                    setErrors((prev) => ({ ...prev, certificate: "" }));
                  }
                }}
              />
              <label
                htmlFor="certificate"
                className={[
                  "flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-xl px-4 py-3 hover:border-purple-300 transition-colors",
                  certificateError ? "border-red-300 bg-red-50" : "border-gray-200",
                ].join(" ")}
              >
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {certificate ? certificate.name : "Upload certificate or award (PDF/JPG/PNG)"}
                </span>
              </label>
              {certificateError ? (
                <p className="mt-1 text-xs text-red-600">{certificateError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Accepted formats: PDF, JPG, PNG. Max size: 5MB.
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Certificates and uploaded documents are private by default and visible only to
                authorised Juggernauts admins.
              </p>
            </div>

            <div>
              <Input
                label="Video Link"
                type="url"
                value={form.video_link}
                onChange={(e) => update("video_link", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                error={errors.video_link}
              />
              {!errors.video_link && (
                <p className="mt-1 text-xs text-gray-500">
                  Paste a public or shareable link to a match highlight, training video, or
                  performance clip.
                </p>
              )}
            </div>

            <Input
              label="Instagram or Public Sports Profile"
              value={form.instagram_link}
              onChange={(e) => update("instagram_link", e.target.value)}
              placeholder="@yourusername or profile link"
              hint="Optional. Add a public profile link only if you are comfortable sharing it."
            />
          </div>
        )}

        {/* === STEP 5: CONSENT & REVIEW === */}
        {currentStep.key === "consent" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Consent &amp; Review</h2>

            {/* Final review summary */}
            <div className="bg-[#F5F3FF] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#3B0764] mb-3 uppercase tracking-wide">
                Profile Summary
              </p>
              <div className="space-y-2">
                {[
                  { label: "Name", value: form.full_name || "—" },
                  {
                    label: "Sport",
                    value:
                      form.primary_sport === "other" && form.other_sport
                        ? form.other_sport
                        : SPORTS.find((s) => s.id === form.primary_sport)?.name || "—",
                  },
                  { label: "Age Group", value: form.age_group || "—" },
                  { label: "District", value: form.district || "—" },
                  { label: "Profile Visibility", value: "Pending admin approval" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span
                      className={`font-medium ${
                        label === "Profile Visibility" ? "text-amber-600" : "text-gray-800"
                      }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-[#3B0764] mb-2">Data Usage Policy</p>
              <p className="text-sm">
                Your information will be used to create and manage your athlete profile on the
                Juggernauts platform. Private data (phone, email, guardian details, date of birth)
                will never be shown publicly. Your public profile will only show your name, sport,
                district, age group, and achievements.
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
                  Juggernauts collecting and using my information for sports profiling, event
                  registration, and talent discovery purposes.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.photo_consent}
                  onChange={(e) => update("photo_consent", e.target.checked)}
                  className="mt-0.5 rounded text-[#5B21B6]"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-semibold">Media Consent</span> — I consent to my profile
                  photo (if uploaded) being displayed publicly on my athlete profile.{" "}
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </span>
              </label>

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
                    parent/guardian of this athlete, I consent to their profile being created on
                    the Juggernauts platform.
                  </span>
                </label>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-xs text-gray-700">
                <span className="font-medium">After submission:</span> Your profile will be
                reviewed by Juggernauts before it appears publicly.
              </p>
              <p className="text-xs text-gray-500">
                Profiles with false, offensive, unsafe, or inappropriate content may be rejected
                or edited by Juggernauts admins.
              </p>
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
