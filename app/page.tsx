import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { Trophy, Shield, Calendar, Star, ArrowRight, CheckCircle, Users, MapPin } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const navUser = user ? { email: user.email, role: profile?.role } : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={navUser} />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 55%, #7C3AED 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-white translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-white -translate-x-1/3 translate-y-1/3" />

        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>Odisha's Grassroots Sports Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-balance mb-6">
            Your Digital
            <span className="block text-yellow-300">Athlete Identity</span>
          </h1>

          <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed mb-10">
            Create your verified sports profile, register for tournaments, and
            build your grassroots sports journey — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-[#3B0764] font-bold shadow-lg w-full sm:w-auto"
              >
                Create Athlete ID
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto"
              >
                <Calendar className="w-4 h-4" />
                View Events
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[
              { value: "30+", label: "Districts" },
              { value: "15+", label: "Sports" },
              { value: "Free", label: "Registration" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{value}</div>
                <div className="text-xs text-purple-200 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#111827]">
              How Juggernauts Athlete ID Works
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Four simple steps to get your verified digital sports identity
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-[#5B21B6]" />,
                step: "01",
                title: "Create Profile",
                desc: "Register with your sport, district, and basic details. No documents required to start.",
              },
              {
                icon: <Shield className="w-6 h-6 text-[#5B21B6]" />,
                step: "02",
                title: "Get Verified",
                desc: "Our Juggernauts volunteers verify your profile to build trust in the community.",
              },
              {
                icon: <Calendar className="w-6 h-6 text-[#5B21B6]" />,
                step: "03",
                title: "Join Events",
                desc: "Register for tournaments and events using your unique Athlete ID.",
              },
              {
                icon: <Star className="w-6 h-6 text-[#5B21B6]" />,
                step: "04",
                title: "Build Journey",
                desc: "Track your achievements, grow your profile, and get discovered.",
              },
            ].map(({ icon, step, title, desc }) => (
              <div
                key={title}
                className="relative bg-[#F5F3FF] rounded-2xl p-6 border border-purple-100 group hover:border-purple-300 transition-colors"
              >
                <div className="absolute top-4 right-4 text-5xl font-black text-purple-100 group-hover:text-purple-200 transition-colors">
                  {step}
                </div>
                <div className="bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-sm mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#111827] leading-tight">
                Built for grassroots athletes
                <span className="text-[#5B21B6]"> across Odisha</span>
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Whether you play football in Cuttack or practise archery in
                Mayurbhanj — Juggernauts Athlete ID gives every young athlete a
                structured, verifiable digital profile.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unique Athlete ID (JG-OD-FB-2026-000001)",
                  "Verified badge from Juggernauts volunteers",
                  "Safe public profile — no private data exposed",
                  "Event registration with Athlete ID",
                  "Digital achievement record",
                  "Shareable profile for WhatsApp & Instagram",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#5B21B6] mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-3">
                <Link href="/auth/register">
                  <Button size="md">Get Started Free</Button>
                </Link>
                <Link href="/events">
                  <Button size="md" variant="outline">
                    Browse Events
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              {/* Sample athlete card mockup */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-purple-100 max-w-sm mx-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] flex items-center justify-center text-white font-bold text-2xl">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Arjun Pradhan</h3>
                    <p className="text-xs text-[#7C3AED] font-mono font-semibold">
                      JG-OD-FB-2026-000001
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mt-1">
                      ✓ Community Verified
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Sport", value: "Football" },
                    { label: "Position", value: "Forward" },
                    { label: "District", value: "Cuttack" },
                    { label: "Age Group", value: "U-17" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="font-semibold text-gray-900 mt-0.5">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[#F5F3FF] rounded-xl">
                  <p className="text-xs text-gray-600">
                    🏆 District level gold medalist 2024 · State U-17 camp participant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Districts coverage */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <MapPin className="w-8 h-8 text-[#5B21B6] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#111827]">
            Covering all 30 districts of Odisha
          </h2>
          <p className="mt-2 text-gray-500 text-sm">
            From Sundergarh to Gajapati — every athlete matters
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              "Khordha", "Cuttack", "Ganjam", "Puri", "Balasore",
              "Sundergarh", "Sambalpur", "Kalahandi", "Koraput", "Mayurbhanj",
              "+ 20 more districts",
            ].map((d) => (
              <span
                key={d}
                className="px-3 py-1 bg-[#F5F3FF] text-[#5B21B6] rounded-full text-xs font-medium"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, #3B0764 0%, #5B21B6 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center text-white">
          <Trophy className="w-10 h-10 text-yellow-300 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Ready to claim your Athlete ID?
          </h2>
          <p className="text-purple-200 mb-8 leading-relaxed">
            Join hundreds of grassroots athletes building their sports profiles.
            Free registration, no documents needed to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-300 text-[#3B0764] font-bold shadow-lg w-full sm:w-auto"
              >
                Create Athlete ID — Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 w-full sm:w-auto"
              >
                View Upcoming Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
