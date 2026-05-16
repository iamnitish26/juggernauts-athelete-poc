"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Users,
  Calendar,
  BarChart2,
  CheckCircle,
  Home,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardSidebarProps {
  role: "admin" | "volunteer";
}

const adminLinks: SidebarLink[] = [
  { href: "/admin",           label: "Overview",        icon: <Home className="w-4 h-4" /> },
  { href: "/admin/athletes",  label: "Athletes",        icon: <Users className="w-4 h-4" /> },
  { href: "/admin/events",    label: "Events",          icon: <Calendar className="w-4 h-4" /> },
  { href: "/admin/analytics", label: "Analytics",       icon: <BarChart2 className="w-4 h-4" /> },
];

const volunteerLinks: SidebarLink[] = [
  { href: "/volunteer",        label: "Overview",        icon: <Home className="w-4 h-4" /> },
  { href: "/volunteer/verify", label: "Verify Athletes", icon: <CheckCircle className="w-4 h-4" /> },
];

function NavLinks({
  links,
  pathname,
  onLinkClick,
}: {
  links: SidebarLink[];
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex-1 p-3 space-y-1">
      {links.map((link) => {
        const active =
          link.href === "/admin" || link.href === "/volunteer"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={[
              "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              active
                ? "bg-[#F5F3FF] text-[#5B21B6]"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            ].join(" ")}
          >
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="p-3 border-t border-gray-100">
      <button
        onClick={onLogout}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = role === "admin" ? adminLinks : volunteerLinks;
  const panelLabel = role === "admin" ? "Admin" : "Volunteer";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen flex-col">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5B21B6] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#3B0764] text-sm">
              Juggernauts
              <span className="block text-[10px] font-medium text-[#7C3AED] -mt-0.5">
                {panelLabel} Panel
              </span>
            </span>
          </Link>
        </div>
        <NavLinks links={links} pathname={pathname} />
        <SignOutButton onLogout={handleLogout} />
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#5B21B6] flex items-center justify-center shrink-0">
            <Trophy className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#3B0764] text-sm truncate">
            Juggernauts
            <span className="text-[10px] font-medium text-[#7C3AED] ml-1">
              {panelLabel}
            </span>
          </span>
        </Link>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 bg-white flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <div className="w-7 h-7 rounded-lg bg-[#5B21B6] flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[#3B0764] text-sm">
                  Juggernauts
                  <span className="block text-[10px] font-medium text-[#7C3AED] -mt-0.5">
                    {panelLabel} Panel
                  </span>
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onLinkClick={() => setMobileOpen(false)} />
            <SignOutButton onLogout={handleLogout} />
          </div>
        </div>
      )}
    </>
  );
}
