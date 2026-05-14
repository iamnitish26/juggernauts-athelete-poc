"use client";

import { useEffect, useRef } from "react";

interface AthleteQRCodeProps {
  athleteId: string;
  size?: number;
}

export default function AthleteQRCode({ athleteId, size = 128 }: AthleteQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const profileUrl = `${base}/athlete/${athleteId}`;

    import("qrcode").then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, profileUrl, {
          width: size,
          margin: 2,
          color: {
            dark: "#3B0764",
            light: "#FFFFFF",
          },
        });
      }
    });
  }, [athleteId, size]);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={canvasRef} className="rounded-lg" />
      <p className="text-xs text-gray-400">Scan to view profile</p>
    </div>
  );
}
