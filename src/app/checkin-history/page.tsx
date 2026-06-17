"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Checkin {
  id: string;
  week_start: string;
  avg_weight: number | null;
  weight_change: number | null;
  waist_change: number | null;
  avg_calories: number | null;
  avg_protein: number | null;
  strength_trend: string | null;
  recommendation: string | null;
  notes: string | null;
}

export default function CheckinHistoryPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("weekly_checkins").select("*").order("week_start", { ascending: false })
      .then(({ data }) => { if (data) setCheckins(data); setLoading(false); });
  }, []);

  const trendColor = (t: string | null) => {
    if (t === "up") return "text-green-400";
    if (t === "down") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Check-In History</h1>

      {loading ? (
        <p className="text-muted text-center py-8">Loading...</p>
      ) : checkins.length === 0 ? (
        <p className="text-muted text-center py-8">No check-ins yet. Complete your first weekly check-in!</p>
      ) : (
        <div className="space-y-4">
          {checkins.map((c) => (
            <div key={c.id} className="bg-card p-5 rounded-lg border border-border">
              <div className="flex justify-between items-start mb-3">
                <span className="font-medium">Week of {c.week_start}</span>
                <span className={`text-sm font-semibold ${trendColor(c.strength_trend)}`}>
                  {c.strength_trend ? c.strength_trend.charAt(0).toUpperCase() + c.strength_trend.slice(1) : "—"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted">Weight:</span><span>{c.avg_weight?.toFixed(1) ?? "—"} lb</span>
                <span className="text-muted">Weight change:</span><span>{c.weight_change != null ? `${c.weight_change > 0 ? "+" : ""}${c.weight_change.toFixed(1)} lb` : "—"}</span>
                <span className="text-muted">Waist change:</span><span>{c.waist_change != null ? `${c.waist_change > 0 ? "+" : ""}${c.waist_change.toFixed(1)} in` : "—"}</span>
                <span className="text-muted">Calories:</span><span>{c.avg_calories?.toFixed(0) ?? "—"}</span>
                <span className="text-muted">Protein:</span><span>{c.avg_protein?.toFixed(0) ?? "—"} g</span>
              </div>
              {c.recommendation && <p className="text-sm mt-3 text-primary">{c.recommendation}</p>}
              {c.notes && <p className="text-sm mt-2 text-muted italic">"{c.notes}"</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
