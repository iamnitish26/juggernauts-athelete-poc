"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, UserCheck } from "lucide-react";

interface Props {
  campId: string;
}

interface AthleteResult {
  id: string;
  athlete_id: string;
  full_name: string;
  primary_sport: string;
  age_group: string;
  gender: string;
  district: string;
}

export default function AddParticipantPanel({ campId }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AthleteResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setMessage("");

    const { data } = await supabase
      .from("athletes")
      .select("id, athlete_id, full_name, primary_sport, age_group, gender, district")
      .or(`full_name.ilike.%${query}%,athlete_id.ilike.%${query}%`)
      .eq("is_active", true)
      .limit(10);

    setResults(data ?? []);
    if (!data || data.length === 0) setMessage("No athletes found.");
    setSearching(false);
  }

  async function handleAdd(athlete: AthleteResult) {
    setAdding(athlete.id);
    setMessage("");

    const { error } = await supabase.from("camp_participants").insert({
      camp_id: campId,
      athlete_id: athlete.id,
      athlete_code: athlete.athlete_id,
    });

    setAdding(null);

    if (error) {
      if (error.code === "23505") {
        setMessage(`${athlete.full_name} is already in this camp.`);
      } else {
        setMessage(`Error: ${error.message}`);
      }
      return;
    }

    setMessage(`${athlete.full_name} added to camp.`);
    setResults([]);
    setQuery("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search by name or Athlete ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" loading={searching} size="sm">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </form>

      {message && (
        <p className={`text-sm px-3 py-2 rounded-xl border ${
          message.startsWith("Error") || message.includes("already")
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {results.map((athlete) => (
            <div key={athlete.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{athlete.full_name}</p>
                <p className="text-xs text-gray-500 font-mono">{athlete.athlete_id}</p>
                <p className="text-xs text-gray-400">{athlete.primary_sport} · {athlete.age_group} · {athlete.district}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleAdd(athlete)}
                loading={adding === athlete.id}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
