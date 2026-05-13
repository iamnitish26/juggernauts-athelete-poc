"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, Calendar, BarChart2, CheckCircle, Home, LogOut } from "lucide-react";
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
  { href: "/admin", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { href: "/admin/athletes", label: "Athletes", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/events", label: "Events", icon: <Calendar className="w-4 h-4" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
];

const volunteerLinks: SidebarLink[] = [
  { href: "/volunteer", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { href: "/volunteer/verify", label: "Verify Athletes", icon: <CheckCircle className="w-4 h-4" /> },
];

export default function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = role === "admin" ? adminLinks : volunteerLinks;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5B21B6] flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[#3B0764] text-sm">
            Juggernauts
            <span className="block text-[10px] font-medium text-[#7C3AED] -mt-0.5">
              {role === "admin" ? "Admin" : "Volunteer"} Panel
            </span>
          </span>
        </Link>
      </div>

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

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
