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
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);

  useEffect(() => {
    supabase.from("weekly_checkins").select("*").order("week_start", { ascending: false })
      .then(({ data }) => { if (data) setCheckins(data); setLoading(false); });
  }, []);

  const trendColor = (t: string | null) => {
    if (t === "up") return "text-green-400";
    if (t === "down") return "text-red-400";
    return "text-yellow-400";
  };

  const trendIcon = (t: string | null) => {
    if (t === "up") return "⬆️";
    if (t === "down") return "⬇️";
    return "➡️";
  };

  const weightTrend = (() => {
    const sorted = [...checkins].sort((a, b) => b.week_start.localeCompare(a.week_start));
    if (sorted.length < 2) return null;
    const recent = sorted[0].avg_weight;
    const prev = sorted[1].avg_weight;
    if (!recent || !prev) return null;
    return recent - prev;
  })();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Check-In History</h1>
        {weightTrend != null && (
          <div className={`text-sm font-semibold ${weightTrend <= 0 ? "text-green-400" : "text-red-400"}`}>
            {weightTrend > 0 ? "+" : ""}{weightTrend.toFixed(1)} lb (last 2 weeks)
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
          <p className="text-muted mt-2">Loading check-ins...</p>
        </div>
      ) : checkins.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted mb-3">No check-ins yet</p>
          <a href="/checkin" className="text-primary hover:text-primary-hover transition">Complete your first weekly check-in →</a>
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((c) => (
            <button key={c.id} onClick={() => setSelectedCheckin(selectedCheckin?.id === c.id ? null : c)}
              className={`w-full text-left bg-card p-4 rounded-lg border transition hover:bg-background/50 ${selectedCheckin?.id === c.id ? "border-primary/50 bg-background/50" : "border-border"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">Week of {new Date(c.week_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {c.strength_trend && (
                    <span className={`ml-2 text-sm font-semibold ${trendColor(c.strength_trend)}`}>
                      {trendIcon(c.strength_trend)} {c.strength_trend.charAt(0).toUpperCase() + c.strength_trend.slice(1)}
                    </span>
                  )}
                </div>
                {c.avg_weight && (
                  <span className="text-sm font-bold">{c.avg_weight.toFixed(1)} lb</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                <span className="text-muted">Weight change:</span>
                <span>{c.weight_change != null ? `${c.weight_change > 0 ? "+" : ""}${c.weight_change.toFixed(1)} lb` : "—"}</span>
                {c.waist_change != null && (
                  <>
                    <span className="text-muted">Waist change:</span>
                    <span>{c.waist_change > 0 ? "+" : ""}{c.waist_change.toFixed(1)} in</span>
                  </>
                )}
                {c.avg_calories != null && (
                  <>
                    <span className="text-muted">Avg calories:</span>
                    <span>{c.avg_calories.toFixed(0)}</span>
                  </>
                )}
                {c.avg_protein != null && (
                  <>
                    <span className="text-muted">Avg protein:</span>
                    <span>{c.avg_protein.toFixed(0)} g</span>
                  </>
                )}
              </div>
              {c.recommendation && (
                <p className={`text-sm mt-2 font-medium ${c.recommendation.startsWith("✅") ? "text-green-300" : c.recommendation.startsWith("⚠️") ? "text-yellow-300" : "text-muted"}`}>
                  {c.recommendation}
                </p>
              )}
              {/* Expandable details */}
              {selectedCheckin?.id === c.id && c.notes && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-sm text-muted italic">"{c.notes}"</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
