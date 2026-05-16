"use client";

import Image from "next/image";
import { useState } from "react";

type BrandLogoVariant = "dark" | "light";
type BrandLogoSize = "sm" | "md" | "lg" | "card";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  showProductName?: boolean;
  showOrgName?: boolean;
  className?: string;
}

const heightClasses: Record<BrandLogoSize, string> = {
  sm:   "h-7 md:h-8",
  md:   "h-8 md:h-10",
  lg:   "h-10 md:h-12",
  card: "h-6 md:h-8",
};

const fallbackSize: Record<BrandLogoSize, string> = {
  sm:   "text-base",
  md:   "text-lg",
  lg:   "text-xl",
  card: "text-sm",
};

export default function BrandLogo({
  variant = "dark",
  size = "md",
  showProductName = false,
  showOrgName = false,
  className = "",
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);
  const src = variant === "light"
    ? "/brand/jsf-logo-light.png"
    : "/brand/jsf-logo-dark.png";

  const textColor    = variant === "light" ? "text-white"      : "text-[#3B0764]";
  const subTextColor = variant === "light" ? "text-white/70"   : "text-[#7C3AED]";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {imgError ? (
        <span className={`font-extrabold tracking-tight ${fallbackSize[size]} ${textColor}`}>
          JSF
        </span>
      ) : (
        <Image
          src={src}
          alt="Juggernauts Sporting Foundation logo"
          width={200}
          height={50}
          className={`${heightClasses[size]} w-auto max-w-[160px] object-contain`}
          onError={() => setImgError(true)}
          priority
        />
      )}

      {(showProductName || showOrgName) && (
        <div className="flex flex-col min-w-0 leading-tight">
          {showProductName && (
            <span className={`font-bold text-sm md:text-base truncate ${textColor}`}>
              Juggernauts Athlete ID
            </span>
          )}
          {showOrgName && (
            <span className={`text-[10px] font-medium truncate ${subTextColor}`}>
              by Juggernauts Sporting Foundation
            </span>
          )}
        </div>
      )}
    </div>
  );
}
