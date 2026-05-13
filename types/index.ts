export type UserRole = "athlete" | "volunteer" | "admin";

export type VerificationStatus =
  | "self_registered"
  | "community_verified"
  | "event_verified"
  | "rejected";

export type AgeGroup = "U-13" | "U-15" | "U-17" | "U-19" | "Senior";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type EventStatus = "draft" | "open" | "closed" | "completed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "waived";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sport {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface District {
  id: string;
  name: string;
  state: string;
}

export interface Athlete {
  id: string;
  user_id: string | null;
  athlete_id: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  age_group: AgeGroup;
  state: string;
  district: string;
  city_block: string | null;
  profile_photo_url: string | null;
  photo_consent: boolean;
  primary_sport: string;
  sport_id: string | null;
  position_event_category: string | null;
  dominant_side: string | null;
  current_club_school: string | null;
  years_of_experience: number | null;
  athlete_phone: string | null;
  athlete_email: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  achievement_summary: string | null;
  certificate_url: string | null;
  video_link: string | null;
  instagram_link: string | null;
  data_consent: boolean;
  guardian_consent: boolean | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  sport: string;
  sport_id: string | null;
  event_date: string;
  venue: string;
  district: string;
  age_category: AgeGroup | "Open";
  registration_fee: number;
  registration_deadline: string;
  max_participants: number | null;
  description: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  athlete_id: string;
  athlete_profile_id: string;
  payment_status: PaymentStatus;
  payment_id: string | null;
  razorpay_order_id: string | null;
  attendance_marked: boolean;
  registered_at: string;
  updated_at: string;
  athlete?: Athlete;
  event?: Event;
}

export interface AthleteRegistrationFormData {
  // Basic details
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  age_group: AgeGroup;
  state: string;
  district: string;
  city_block: string;
  profile_photo?: File;
  photo_consent: boolean;
  // Sport details
  primary_sport: string;
  sport_id: string;
  position_event_category: string;
  dominant_side: string;
  current_club_school: string;
  years_of_experience: number;
  // Contact details
  athlete_phone: string;
  athlete_email: string;
  guardian_name: string;
  guardian_phone: string;
  // Achievements
  achievement_summary: string;
  certificate?: File;
  video_link: string;
  instagram_link: string;
  // Consent
  data_consent: boolean;
  guardian_consent: boolean;
}
