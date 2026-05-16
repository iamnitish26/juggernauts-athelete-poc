import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Juggernauts Athlete ID | Grassroots Sports Platform by JSF",
  description:
    "Create verified grassroots athlete profiles, register for events, and build a digital sports identity across Odisha with Juggernauts Athlete ID by Juggernauts Sporting Foundation.",
  keywords: ["sports", "athlete", "Odisha", "grassroots", "football", "hockey", "Juggernauts", "JSF", "Juggernauts Sporting Foundation"],
  openGraph: {
    title: "Juggernauts Athlete ID | by Juggernauts Sporting Foundation",
    description: "Your verified digital sports identity — built for grassroots athletes across Odisha by JSF.",
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
