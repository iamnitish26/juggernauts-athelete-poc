"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Download, FileText } from "lucide-react";

interface Props {
  range?: string;
}

function getSince(range?: string): string | null {
  if (range === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "90d") return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function triggerCSVDownload(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const escape = (v: string | number | boolean | null | undefined) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsExportButtons({ range }: Props) {
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const supabase = createClient();

  async function exportAthletes() {
    setLoadingAthletes(true);
    const since = getSince(range);
    let q = supabase
      .from("athletes")
      .select(
        "athlete_id, full_name, primary_sport, district, age_group, gender, verification_status, profile_status, is_public, created_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (since) q = q.gte("created_at", since);
    const { data } = await q;

    triggerCSVDownload(
      `juggernauts_athletes_${range ?? "all"}_${new Date().toISOString().slice(0, 10)}.csv`,
      ["Athlete ID", "Full Name", "Sport", "District", "Age Group", "Gender", "Verification Status", "Profile Status", "Public Profile", "Registered At"],
      data?.map((a) => [
        a.athlete_id,
        a.full_name,
        a.primary_sport,
        a.district,
        a.age_group,
        a.gender,
        a.verification_status,
        a.profile_status,
        a.is_public ? "Yes" : "No",
        a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN") : "",
      ]) ?? []
    );
    setLoadingAthletes(false);
  }

  async function exportRegistrations() {
    setLoadingRegs(true);
    const since = getSince(range);
    let q = supabase
      .from("event_registrations")
      .select("athlete_id, registration_status, payment_status, amount, razorpay_payment_id, registered_at, confirmed_at, events(name, sport, district)")
      .order("registered_at", { ascending: false });
    if (since) q = q.gte("registered_at", since);
    const { data } = await q;

    triggerCSVDownload(
      `juggernauts_registrations_${range ?? "all"}_${new Date().toISOString().slice(0, 10)}.csv`,
      ["Athlete ID", "Event Name", "Sport", "District", "Registration Status", "Payment Status", "Amount (₹)", "Razorpay Payment ID", "Registered At", "Confirmed At"],
      data?.map((r) => {
        const ev = (Array.isArray(r.events) ? r.events[0] : r.events) as { name: string; sport: string; district: string } | null;
        return [
          r.athlete_id,
          ev?.name ?? "",
          ev?.sport ?? "",
          ev?.district ?? "",
          r.registration_status,
          r.payment_status,
          r.amount ?? "",
          r.razorpay_payment_id ?? "",
          r.registered_at ? new Date(r.registered_at).toLocaleDateString("en-IN") : "",
          r.confirmed_at ? new Date(r.confirmed_at).toLocaleDateString("en-IN") : "",
        ];
      }) ?? []
    );
    setLoadingRegs(false);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={exportAthletes} loading={loadingAthletes}>
        <Download className="w-3.5 h-3.5" />
        Export Athletes CSV
      </Button>
      <Button size="sm" variant="outline" onClick={exportRegistrations} loading={loadingRegs}>
        <Download className="w-3.5 h-3.5" />
        Export Registrations CSV
      </Button>
      {/* TODO: Generate a PDF/HTML pilot report with charts and summary tables */}
      <Button size="sm" variant="ghost" disabled title="Coming soon — will generate a formatted PDF pilot report">
        <FileText className="w-3.5 h-3.5" />
        Pilot Report
      </Button>
    </div>
  );
}
