"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WeightChart } from "@/components/charts/weight-chart";
import { BodyLogForm } from "@/components/forms/body-log-form";

interface BodyLog {
  date: string;
  bodyweight: number;
  waist: number | null;
}

interface Workout {
  id: string;
  date: string;
  name: string;
}

interface DailyFoodTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function DashboardPage() {
  const [bodylogs, setBodyLogs] = useState<BodyLog[]>([]);
  const [todayTotals, setTodayTotals] = useState<DailyFoodTotals | null>(null);
  const [weeklyTotals, setWeeklyTotals] = useState<DailyFoodTotals | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split("T")[0];

        // Body logs (30 days)
        const { data: logs } = await supabase
          .from("body_logs")
          .select("*")
          .order("date", { ascending: false })
          .limit(30);
        if (logs) setBodyLogs(logs);

        // Today's food totals
        const { data: todayFoods } = await supabase
          .from("food_logs")
          .select("calories, protein, carbs, fat")
          .eq("date", today);
        if (todayFoods && todayFoods.length > 0) {
          setTodayTotals({
            calories: todayFoods.reduce((s, f) => s + (f.calories || 0), 0),
            protein: todayFoods.reduce((s, f) => s + (f.protein || 0), 0),
            carbs: todayFoods.reduce((s, f) => s + (f.carbs || 0), 0),
            fat: todayFoods.reduce((s, f) => s + (f.fat || 0), 0),
          });
        }

        // Last 7 days food totals
        const { data: weekFoods } = await supabase
          .from("food_logs")
          .select("date, calories, protein, carbs, fat")
          .gte("date", weekAgoStr)
          .lt("date", today);
        if (weekFoods && weekFoods.length > 0) {
          const days = Math.max(1, new Set(weekFoods.map((f) => f.date)).size);
          setWeeklyTotals({
            calories: weekFoods.reduce((s, f) => s + (f.calories || 0), 0) / days,
            protein: weekFoods.reduce((s, f) => s + (f.protein || 0), 0) / days,
            carbs: weekFoods.reduce((s, f) => s + (f.carbs || 0), 0) / days,
            fat: weekFoods.reduce((s, f) => s + (f.fat || 0), 0) / days,
          });
        }

        // Recent workouts
        const { data: recentWorkouts } = await supabase
          .from("workouts")
          .select("*")
          .order("date", { ascending: false })
          .limit(10);
        if (recentWorkouts) setWorkouts(recentWorkouts);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate weekly weight change
  const weeklyWeightChange = (() => {
    if (bodylogs.length < 2) return null;
    const sorted = [...bodylogs].sort((a, b) => a.date.localeCompare(b.date));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const avg1 = firstHalf.reduce((s, l) => s + l.bodyweight, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((s, l) => s + l.bodyweight, 0) / secondHalf.length;
    return avg2 - avg1;
  })();

  const latestLog = bodylogs.length > 0 ? bodylogs[0] : null;
  const latestWaist = bodylogs.find((l) => l.waist !== null)?.waist ?? null;

  // Next workout: find the next date after today that has a workout
  const today = new Date().toISOString().split("T")[0];
  const nextWorkout = workouts.find((w) => w.date > today);

  const weightData = bodylogs.map((l) => ({
    date: l.date,
    weight: l.bodyweight,
    avg7: 0,
  }));

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maingain-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={handleExport} disabled={exporting}
          className="text-xs text-muted hover:text-foreground transition flex items-center gap-1">
          {exporting ? "⏳" : "⬇"} Export Data
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-center py-12">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="text-sm font-medium text-muted mb-1">Weight</h2>
              <p className="text-2xl font-bold">
                {latestLog ? `${latestLog.bodyweight.toFixed(1)} lb` : "—"}
              </p>
            </div>
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="text-sm font-medium text-muted mb-1">Weekly Change</h2>
              <p className={`text-2xl font-bold ${weeklyWeightChange && weeklyWeightChange > 0 ? "text-red-400" : weeklyWeightChange && weeklyWeightChange < 0 ? "text-green-400" : "text-muted"}`}>
                {weeklyWeightChange != null ? `${weeklyWeightChange > 0 ? "+" : ""}${weeklyWeightChange.toFixed(1)} lb` : "—"}
              </p>
            </div>
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="text-sm font-medium text-muted mb-1">Today&apos;s Calories</h2>
              <p className="text-2xl font-bold">{todayTotals?.calories ?? "—"}</p>
            </div>
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="text-sm font-medium text-muted mb-1">Today&apos;s Protein</h2>
              <p className="text-2xl font-bold">{todayTotals?.protein ?? "—"} g</p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="font-semibold mb-4">Weight Trend</h2>
            <WeightChart data={weightData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="font-semibold mb-4">Log Bodyweight</h2>
              <BodyLogForm />
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="font-semibold mb-4">Quick Stats</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-muted">Latest waist</span><span>{latestWaist != null ? `${latestWaist.toFixed(1)} in` : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted">Weekly calorie avg</span><span>{weeklyTotals?.calories?.toFixed(0) ?? "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted">Weekly protein avg</span><span>{weeklyTotals?.protein?.toFixed(0) ?? "—"} g</span></li>
                <li className="flex justify-between"><span className="text-muted">Weekly fat avg</span><span>{weeklyTotals?.fat?.toFixed(0) ?? "—"} g</span></li>
                <li className="flex justify-between"><span className="text-muted">Next workout</span><span>{nextWorkout ? nextWorkout.date : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted">Recent workouts</span><span>{workouts.length}</span></li>
              </ul>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
