import { VERIFICATION_STATUS_COLORS, VERIFICATION_STATUS_LABELS } from "@/lib/constants";

interface BadgeProps {
  label?: string;
  color?: string;
  className?: string;
}

interface VerificationBadgeProps {
  status: string;
  className?: string;
}

export function Badge({ label, color = "bg-gray-100 text-gray-800", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}
    >
      {label}
    </span>
  );
}

export function VerificationBadge({ status, className = "" }: VerificationBadgeProps) {
  const color = VERIFICATION_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
  const label = VERIFICATION_STATUS_LABELS[status] ?? status;

  const icons: Record<string, string> = {
    self_registered: "○",
    community_verified: "✓",
    event_verified: "★",
    rejected: "✕",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${color} ${className}`}
    >
      <span>{icons[status] ?? "○"}</span>
      {label}
    </span>
  );
}
