"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, Trophy, ChevronDown } from "lucide-react";

interface NavbarProps {
  user?: { email?: string; role?: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "volunteer"
      ? "/volunteer"
      : "/athlete/register";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#5B21B6] flex items-center justify-center group-hover:bg-[#7C3AED] transition-colors">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[#3B0764] text-lg leading-tight">
              Juggernauts
              <span className="block text-xs font-medium text-[#7C3AED] -mt-1">
                Athlete ID
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/events"
              className="text-sm font-medium text-gray-600 hover:text-[#5B21B6] transition-colors"
            >
              Events
            </Link>
            <Link
              href="/athlete/register"
              className="text-sm font-medium text-gray-600 hover:text-[#5B21B6] transition-colors"
            >
              Register
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={dashboardHref}>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Athlete ID</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-3">
          <Link
            href="/events"
            className="text-sm font-medium text-gray-700 py-2"
            onClick={() => setMenuOpen(false)}
          >
            Events
          </Link>
          <Link
            href="/athlete/register"
            className="text-sm font-medium text-gray-700 py-2"
            onClick={() => setMenuOpen(false)}
          >
            Register as Athlete
          </Link>
          {user ? (
            <>
              <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Get Athlete ID
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
