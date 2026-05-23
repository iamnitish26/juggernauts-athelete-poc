"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { TrendingUp } from "lucide-react";

interface Props {
  campId: string;
  athleteId: string;
}

export default function CalculateScoreButton({ campId, athleteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleCalculate() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/camps/${campId}/calculate/${athleteId}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Calculation failed.");
      } else {
        setMessage(`Score calculated: ${json.rating_10?.toFixed(1)} / 10`);
        router.refresh();
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handleCalculate} loading={loading} size="sm">
        <TrendingUp className="w-4 h-4" />
        {loading ? "Calculating..." : "Calculate Score"}
      </Button>
      {message && (
        <p className={`text-xs ${message.includes("failed") || message.includes("error") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
