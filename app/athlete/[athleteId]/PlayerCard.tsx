"use client";

import { useRef } from "react";
import { MapPin } from "lucide-react";
import AthleteQRCode from "@/components/ui/AthleteQRCode";
import BrandLogo from "@/components/brand/BrandLogo";

interface PlayerCardProps {
  athleteId: string;
  name: string;
  sport: string;
  district: string;
  ageGroup: string;
  positionEvent: string | null;
  verificationStatus: string;
  initials: string;
  photoUrl: string | null;
  photoConsent: boolean;
}

const BADGE_LABELS: Record<string, string> = {
  self_registered: "Self Registered",
  community_verified: "Community Verified",
  event_verified: "Event Verified",
};

const BADGE_COLORS: Record<string, string> = {
  self_registered: "bg-yellow-100 text-yellow-800",
  community_verified: "bg-blue-100 text-blue-800",
  event_verified: "bg-green-100 text-green-800",
};

export default function PlayerCard({
  athleteId,
  name,
  sport,
  district,
  ageGroup,
  positionEvent,
  verificationStatus,
  initials,
  photoUrl,
  photoConsent,
}: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3">
      {/* The card itself */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] rounded-3xl p-5 text-white shadow-xl max-w-xs mx-auto"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <BrandLogo variant="light" size="card" />
          <span
            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
              BADGE_COLORS[verificationStatus] ?? "bg-white/20 text-white"
            }`}
          >
            {BADGE_LABELS[verificationStatus] ?? verificationStatus}
          </span>
        </div>

        {/* Athlete info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
            {photoUrl && photoConsent ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-extrabold text-white">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base leading-tight truncate">{name}</h2>
            <p className="font-mono text-[10px] text-purple-300 mt-0.5">{athleteId}</p>
            <div className="flex items-center gap-1 mt-1 text-purple-200 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{district}, Odisha</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: "Sport", value: sport },
            { label: "Age Group", value: ageGroup },
            ...(positionEvent
              ? [{ label: "Position / Event", value: positionEvent }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2">
              <p className="text-[9px] text-purple-300 uppercase tracking-wide">{label}</p>
              <p className="text-xs font-semibold mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* QR code */}
        <div className="flex justify-center bg-white rounded-2xl p-2">
          <AthleteQRCode athleteId={athleteId} size={80} />
        </div>

        {/* Footer attribution */}
        <p className="text-center text-[8px] text-purple-400 mt-3 tracking-wide">
          Verified on Juggernauts Athlete ID by JSF
        </p>
      </div>

      {/* Download placeholder */}
      <p className="text-center text-xs text-gray-400">
        Screenshot this card to save or share.{" "}
        <span className="text-[#5B21B6]">Download feature coming soon.</span>
      </p>
    </div>
  );
}
