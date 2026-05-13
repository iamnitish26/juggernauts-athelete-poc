export const SPORTS = [
  { id: "football", name: "Football", code: "FB" },
  { id: "hockey", name: "Hockey", code: "HK" },
  { id: "athletics", name: "Athletics", code: "AT" },
  { id: "cricket", name: "Cricket", code: "CK" },
  { id: "badminton", name: "Badminton", code: "BD" },
  { id: "basketball", name: "Basketball", code: "BK" },
  { id: "volleyball", name: "Volleyball", code: "VB" },
  { id: "kabaddi", name: "Kabaddi", code: "KB" },
  { id: "wrestling", name: "Wrestling", code: "WR" },
  { id: "boxing", name: "Boxing", code: "BX" },
  { id: "swimming", name: "Swimming", code: "SW" },
  { id: "table_tennis", name: "Table Tennis", code: "TT" },
  { id: "tennis", name: "Tennis", code: "TN" },
  { id: "archery", name: "Archery", code: "AR" },
  { id: "other", name: "Other", code: "OT" },
] as const;

export const ODISHA_DISTRICTS = [
  "Angul",
  "Balangir",
  "Balasore",
  "Bargarh",
  "Bhadrak",
  "Boudh",
  "Cuttack",
  "Deogarh",
  "Dhenkanal",
  "Gajapati",
  "Ganjam",
  "Jagatsinghpur",
  "Jajpur",
  "Jharsuguda",
  "Kalahandi",
  "Kandhamal",
  "Kendrapara",
  "Kendujhar",
  "Khordha",
  "Koraput",
  "Malkangiri",
  "Mayurbhanj",
  "Nabarangpur",
  "Nayagarh",
  "Nuapada",
  "Puri",
  "Rayagada",
  "Sambalpur",
  "Subarnapur",
  "Sundergarh",
] as const;

export const AGE_GROUPS = ["U-13", "U-15", "U-17", "U-19", "Senior"] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  self_registered: "Self Registered",
  community_verified: "Community Verified",
  event_verified: "Event Verified",
  rejected: "Rejected",
};

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  self_registered: "bg-yellow-100 text-yellow-800",
  community_verified: "bg-blue-100 text-blue-800",
  event_verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function getSportCode(sportName: string): string {
  const sport = SPORTS.find(
    (s) => s.name.toLowerCase() === sportName.toLowerCase()
  );
  return sport?.code ?? "OT";
}

export function calculateAgeGroup(dob: string): string {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  if (age < 13) return "U-13";
  if (age < 15) return "U-13";
  if (age < 15) return "U-15";
  if (age < 17) return "U-15";
  if (age < 17) return "U-17";
  if (age < 19) return "U-17";
  if (age < 19) return "U-19";
  return "Senior";
}

export function getAgeFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function isMinor(dob: string): boolean {
  return getAgeFromDob(dob) < 18;
}
