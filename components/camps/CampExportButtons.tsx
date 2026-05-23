"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Download } from "lucide-react";

interface Props {
  campId: string;
  campName: string;
}

export default function CampExportButtons({ campId, campName }: Props) {
  const [loading, setLoading] = useState<"shortlist" | "full" | null>(null);

  async function handleExport(type: "shortlist" | "full") {
    setLoading(type);
    try {
      const res = await fetch(`/api/camps/${campId}/export?type=${type}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campName.replace(/\s+/g, "-")}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("shortlist")}
        loading={loading === "shortlist"}
      >
        <Download className="w-4 h-4" />
        Export Shortlist
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("full")}
        loading={loading === "full"}
      >
        <Download className="w-4 h-4" />
        Export Full Results
      </Button>
    </>
  );
}
