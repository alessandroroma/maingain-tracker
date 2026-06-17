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

export default function CheckinPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  });
  const [avgWeight, setAvgWeight] = useState("");
  const [prevAvgWeight, setPrevAvgWeight] = useState("");
  const [waistChange, setWaistChange] = useState("");
  const [avgCalories, setAvgCalories] = useState("");
  const [avgProtein, setAvgProtein] = useState("");
  const [strengthTrend, setStrengthTrend] = useState("stable");
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prevWeekWeight, setPrevWeekWeight] = useState<number | null>(null);

  async function autoCalculate() {
    setLoading(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split("T")[0];

      // Current week body logs
      const { data: weightData } = await supabase
        .from("body_logs")
        .select("bodyweight")
        .gte("date", weekStart)
        .lt("date", weekEndStr);

      if (weightData && weightData.length > 0) {
        const avg = weightData.reduce((s, w) => s + w.bodyweight, 0) / weightData.length;
        setAvgWeight(avg.toFixed(1));
        setPrevWeekWeight(null); // Will calculate below
      }

      // Previous week for comparison
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekEnd = new Date(weekStart);

      const { data: prevWeights } = await supabase
        .from("body_logs")
        .select("bodyweight")
        .gte("date", prevWeekStart.toISOString().split("T")[0])
        .lt("date", prevWeekEnd.toISOString().split("T")[0]);

      if (prevWeights && prevWeights.length > 0) {
        const prevAvg = prevWeights.reduce((s, w) => s + w.bodyweight, 0) / prevWeights.length;
        setPrevAvgWeight(prevAvg.toFixed(1));
        setPrevWeekWeight(prevAvg);
      }

      // Current week food logs
      const { data: foodData } = await supabase
        .from("food_logs")
        .select("calories, protein")
        .gte("date", weekStart)
        .lt("date", weekEndStr);

      if (foodData && foodData.length > 0) {
        const calAvg = foodData.reduce((s, f) => s + f.calories, 0) / foodData.length;
        const protAvg = foodData.reduce((s, f) => s + f.protein, 0) / foodData.length;
        setAvgCalories(calAvg.toFixed(0));
        setAvgProtein(protAvg.toFixed(0));
      }

      // Auto-generate recommendation based on data
      generateRecommendation(avgWeight, prevWeekWeight);
    } catch {
      setRecommendation("Could not auto-calculate. Enter manually.");
    } finally {
      setLoading(false);
    }
  }

  function generateRecommendation(avgWeight: string, prevWeekWeight: number | null) {
    if (!avgWeight || !prevWeekWeight) return;

    const current = parseFloat(avgWeight);
    const change = current - prevWeekWeight;

    // Weight change in last 7 days (approximate weekly change)
    const weeklyChange = change;

    if (weeklyChange >= -0.75 && weeklyChange <= 0.75 && strengthTrend === "up") {
      setRecommendation("✅ Ideal recomp — keep calories the same. Scale flat/slightly down with waist down and strength up is exactly what you want.");
    } else if (weeklyChange < -0.75 && strengthTrend === "down") {
      setRecommendation("⚠️ Dropping too fast with strength loss — increase calories by 100-200 kcal/day. You're sacrificing muscle.");
    } else if (weeklyChange > 0.75) {
      setRecommendation("⚠️ Gaining too fast — reduce calories by 100-200 kcal/day. Aim for 0.25-0.75 lb/week loss for recomp.");
    } else if (Math.abs(weeklyChange) <= 0.25 && strengthTrend === "stable") {
      setRecommendation("✅ Good plateau — keep calories the same. If waist is also flat for 2+ weeks, try reducing by 100-150 kcal.");
    } else if (weeklyChange < 0 && strengthTrend === "stable") {
      setRecommendation("✅ Solid progress — keep calories the same. Weight down and strength stable is the goal.");
    } else if (weeklyChange > 0 && strengthTrend === "stable") {
      setRecommendation("⚠️ Scale up but strength stable — slightly reduce calories by 100 kcal. You might be gaining faster than fat.");
    } else {
      setRecommendation("✅ Keep calories the same — review trends and adjust as needed.");
    }
  }

  // Update recommendation when strength trend changes
  async function updateRecommendation() {
    if (avgWeight && prevWeekWeight != null) {
      generateRecommendation(avgWeight, prevWeekWeight);
    }
  }

  async function saveCheckin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supabase.from("weekly_checkins").insert({
        week_start: weekStart,
        avg_weight: avgWeight ? parseFloat(avgWeight) : null,
        prev_avg_weight: prevAvgWeight ? parseFloat(prevAvgWeight) : null,
        weight_change: avgWeight && prevAvgWeight
          ? parseFloat(avgWeight) - parseFloat(prevAvgWeight)
          : null,
        waist_change: waistChange ? parseFloat(waistChange) : null,
        avg_calories: avgCalories ? parseFloat(avgCalories) : null,
        avg_protein: avgProtein ? parseFloat(avgProtein) : null,
        strength_trend: strengthTrend,
        recommendation,
        notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      console.error("Failed to save check-in");
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Weekly Check-In</h1>

      <div className="bg-card p-6 rounded-lg border border-border mb-6">
        <h2 className="font-semibold mb-4">Auto-Calculate from Data</h2>
        <div className="flex gap-3">
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
            className="bg-card border border-border rounded px-3 py-2 text-foreground" />
          <button onClick={autoCalculate} disabled={loading}
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded transition">
            {loading ? "Calculating..." : "Calculate from data"}
          </button>
        </div>
      </div>

      <form onSubmit={saveCheckin} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">This Week Avg Weight (lb)</label>
            <input type="number" step="0.1" value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Last Week Avg Weight (lb)</label>
            <input type="number" step="0.1" value={prevAvgWeight} onChange={(e) => setPrevAvgWeight(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Waist Change (in)</label>
            <input type="number" step="0.1" value={waistChange} onChange={(e) => setWaistChange(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Strength Trend</label>
            <select value={strengthTrend} onChange={(e) => { setStrengthTrend(e.target.value); updateRecommendation(); }}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground">
              <option value="up">Up ⬆️</option>
              <option value="stable">Stable ➡️</option>
              <option value="down">Down ⬇️</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1">Avg Calories</label>
            <input type="number" value={avgCalories} onChange={(e) => setAvgCalories(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Avg Protein (g)</label>
            <input type="number" value={avgProtein} onChange={(e) => setAvgProtein(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
        </div>

        {/* Auto-generated recommendation display */}
        {recommendation && recommendation.startsWith("✅") && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
            <p className="text-sm text-green-300">{recommendation}</p>
          </div>
        )}
        {recommendation && recommendation.startsWith("⚠️") && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-sm text-yellow-300">{recommendation}</p>
          </div>
        )}

        <div>
          <label className="block text-sm text-muted mb-1">Override Recommendation</label>
          <input type="text" value={recommendation.replace(/^[✅⚠️]\s*/, "")}
            onChange={(e) => setRecommendation((recommendation.startsWith("✅") ? "✅ " : recommendation.startsWith("⚠️") ? "⚠️ " : "") + e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <button type="submit"
          className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded transition">
          {saved ? "✅ Saved!" : "Save Check-In"}
        </button>
      </form>
    </main>
  );
}
