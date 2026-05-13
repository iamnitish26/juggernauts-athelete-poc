import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juggernauts Athlete ID | Grassroots Sports Platform",
  description:
    "Create your digital sports profile, get verified, and register for events. Juggernauts Athlete ID — empowering grassroots athletes in Odisha.",
  keywords: ["sports", "athlete", "Odisha", "grassroots", "football", "hockey", "Juggernauts"],
  openGraph: {
    title: "Juggernauts Athlete ID",
    description: "Your digital sports identity — built for grassroots athletes in Odisha",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
