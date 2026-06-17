"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckinPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  });
  const [avgWeight, setAvgWeight] = useState("");
  const [waistChange, setWaistChange] = useState("");
  const [avgCalories, setAvgCalories] = useState("");
  const [avgProtein, setAvgProtein] = useState("");
  const [strengthTrend, setStrengthTrend] = useState("stable");
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function autoCalculate() {
    setLoading(true);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: weightData } = await supabase
        .from("body_logs")
        .select("bodyweight")
        .gte("date", weekStart)
        .lt("date", weekEnd.toISOString().split("T")[0]);

      if (weightData && weightData.length > 0) {
        const avg = weightData.reduce((s, w) => s + w.bodyweight, 0) / weightData.length;
        setAvgWeight(avg.toFixed(1));
      }

      const { data: foodData } = await supabase
        .from("food_logs")
        .select("calories, protein")
        .gte("date", weekStart)
        .lt("date", weekEnd.toISOString().split("T")[0]);

      if (foodData && foodData.length > 0) {
        const calAvg = foodData.reduce((s, f) => s + f.calories, 0) / foodData.length;
        const protAvg = foodData.reduce((s, f) => s + f.protein, 0) / foodData.length;
        setAvgCalories(calAvg.toFixed(0));
        setAvgProtein(protAvg.toFixed(0));
      }

      // Simple recommendation logic
      if (avgWeight) {
        const w = parseFloat(avgWeight);
        setRecommendation("Keep calories the same — looks steady.");
      }
    } catch {
      setRecommendation("Could not auto-calculate. Enter manually.");
    } finally {
      setLoading(false);
    }
  }

  async function saveCheckin(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supabase.from("weekly_checkins").insert({
        week_start: weekStart,
        avg_weight: avgWeight ? parseFloat(avgWeight) : null,
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
        <h2 className="font-semibold mb-4">Auto-Calculate</h2>
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
            <label className="block text-sm text-muted mb-1">Avg Weight (lb)</label>
            <input type="number" step="0.1" value={avgWeight} onChange={(e) => setAvgWeight(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Waist Change (in)</label>
            <input type="number" step="0.1" value={waistChange} onChange={(e) => setWaistChange(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
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
        <div>
          <label className="block text-sm text-muted mb-1">Strength Trend</label>
          <select value={strengthTrend} onChange={(e) => setStrengthTrend(e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground">
            <option value="up">Up</option>
            <option value="stable">Stable</option>
            <option value="down">Down</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Recommendation</label>
          <input type="text" value={recommendation} onChange={(e) => setRecommendation(e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <button type="submit"
          className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded transition">
          {saved ? "Saved!" : "Save Check-In"}
        </button>
      </form>
    </main>
  );
}
