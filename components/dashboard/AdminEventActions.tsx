"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  MoreVertical,
  Edit,
  Users,
  Download,
  XCircle,
  CheckCircle,
  ExternalLink,
  Settings,
} from "lucide-react";

interface EventSummary {
  id: string;
  name: string;
  status: string;
}

export default function AdminEventActions({ event }: { event: EventSummary }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function updateStatus(newStatus: "closed" | "completed") {
    if (!confirm(`Mark this event as "${newStatus}"?`)) return;
    setBusy(newStatus);
    const { error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", event.id);
    setBusy("");
    setOpen(false);
    if (error) { alert("Failed: " + error.message); return; }
    router.refresh();
  }

  async function exportCSV() {
    setBusy("csv");
    const { data, error } = await supabase
      .from("event_registrations")
      .select(
        "athlete_id, registration_status, payment_status, amount, razorpay_payment_id, registered_at, confirmed_at, athletes(full_name)"
      )
      .eq("event_id", event.id)
      .order("registered_at", { ascending: true });

    if (error || !data) {
      alert("Failed to fetch registrations.");
      setBusy("");
      return;
    }

    const headers = [
      "Athlete Name",
      "Athlete ID",
      "Registration Status",
      "Payment Status",
      "Amount (₹)",
      "Razorpay Payment ID",
      "Registered At",
      "Confirmed At",
    ];

    const rows = data.map((r) => {
      const athleteRaw = r.athletes as unknown;
      const athlete = (Array.isArray(athleteRaw) ? athleteRaw[0] : athleteRaw) as
        | { full_name: string }
        | null;
      return [
        athlete?.full_name ?? "",
        r.athlete_id,
        r.registration_status,
        r.payment_status,
        r.amount ?? "",
        r.razorpay_payment_id ?? "",
        r.registered_at ? new Date(r.registered_at).toLocaleString("en-IN") : "",
        r.confirmed_at ? new Date(r.confirmed_at).toLocaleString("en-IN") : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.name.replace(/\s+/g, "_")}_registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy("");
    setOpen(false);
  }

  const isOpen = event.status === "open";
  const isDraftOrOpen = event.status === "draft" || event.status === "open";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Event actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm max-h-[80vh] overflow-y-auto">
          <Link
            href={`/admin/events/${event.id}`}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Settings className="w-3.5 h-3.5 text-[#5B21B6]" />
            Manage Event
          </Link>

          <Link
            href={`/admin/events/${event.id}/edit`}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
            Edit Event
          </Link>

          <Link
            href={`/admin/events/${event.id}`}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <Users className="w-3.5 h-3.5 text-gray-500" />
            View Registrations
          </Link>

          <button
            onClick={exportCSV}
            disabled={busy === "csv"}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            {busy === "csv" ? "Exporting..." : "Export CSV"}
          </button>

          <div className="border-t border-gray-100 my-1" />

          {isOpen && (
            <button
              onClick={() => updateStatus("closed")}
              disabled={!!busy}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              {busy === "closed" ? "Closing..." : "Close Registration"}
            </button>
          )}

          {isDraftOrOpen && (
            <button
              onClick={() => updateStatus("completed")}
              disabled={!!busy}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {busy === "completed" ? "Updating..." : "Mark Completed"}
            </button>
          )}

          <div className="border-t border-gray-100 my-1" />

          <Link
            href={`/events/${event.id}`}
            target="_blank"
            className="flex items-center gap-2.5 px-4 py-2 text-gray-500 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Page
          </Link>
        </div>
      )}
    </div>
  );
}
