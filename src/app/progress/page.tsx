"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WeightChart } from "@/components/charts/weight-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { MacroDonut } from "@/components/charts/macro-donut";

interface BodyLog {
  id: string;
  date: string;
  bodyweight: number;
  waist: number | null;
}

interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  exercises: { name: string };
  workouts: { date: string };
}

interface DailyMacros {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function ProgressPage() {
  const [bodylogs, setBodyLogs] = useState<BodyLog[]>([]);
  const [volumeData, setVolumeData] = useState<Record<string, { volume: number; sets: number; bestWeight: number }>>({});
  const [dailyMacros, setDailyMacros] = useState<DailyMacros[]>([]);
  const [weeklyMacros, setWeeklyMacros] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Targets
  const targets = { protein: 190, carbs: 275, fat: 75, calories: 2700 };

  useEffect(() => {
    async function fetchAll() {
      try {
        // Body logs (90 days)
        const { data: logs } = await supabase
          .from("body_logs")
          .select("*")
          .order("date", { ascending: true })
          .limit(90);
        if (logs) setBodyLogs(logs);

        // Volume by exercise (recent)
        const { data: sets } = await supabase
          .from("workout_sets")
          .select("exercise_id, weight, reps, exercises(name), workouts(date)")
          .order("workouts.date", { ascending: false })
          .limit(150);

        if (sets) {
          const byEx: Record<string, { volumes: number[]; weights: number[]; count: number }> = {};
          sets.forEach((s) => {
            const key = s.exercises?.name || s.exercise_id;
            if (!byEx[key]) byEx[key] = { volumes: [], weights: [], count: 0 };
            const vol = (s.weight || 0) * (s.reps || 0);
            byEx[key].volumes.push(vol);
            byEx[key].weights.push(s.weight);
            byEx[key].count += 1;
          });
          const chartData = Object.entries(byEx).map(([exercise, data]) => ({
            exercise: exercise.replace(/_/g, " "),
            volume: Math.max(...data.volumes),
            sets: data.count,
            bestWeight: Math.max(...data.weights),
          }));
          setVolumeData(chartData as unknown as Record<string, { volume: number; sets: number; bestWeight: number }>);
        }

        // Daily macros (last 14 days)
        const { data: foods } = await supabase
          .from("food_logs")
          .select("date, calories, protein, carbs, fat")
          .gte("date", new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
          .order("date", { ascending: false });
        if (foods) {
          setDailyMacros(foods as DailyMacros[]);

          // Weekly average
          const days = new Set(foods.map((f) => f.date)).size;
          if (days > 0) {
            setWeeklyMacros({
              calories: foods.reduce((s, f) => s + (f.calories || 0), 0) / days,
              protein: foods.reduce((s, f) => s + (f.protein || 0), 0) / days,
              carbs: foods.reduce((s, f) => s + (f.carbs || 0), 0) / days,
              fat: foods.reduce((s, f) => s + (f.fat || 0), 0) / days,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const weightChartData = bodylogs.map((l) => ({
    date: l.date,
    weight: l.bodyweight,
    avg7: 0,
  }));

  const latestWeight = bodylogs.length > 0 ? bodylogs[bodylogs.length - 1].bodyweight : null;
  const firstWeight = bodylogs.length > 0 ? bodylogs[0].bodyweight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  const pct = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));
  const barColor = (p: number) => p >= 100 ? "bg-green-500" : p >= 80 ? "bg-blue-500" : p >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Overall Stats */}
      {weightChange != null && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border border-border text-center">
            <p className="text-xs text-muted mb-1">Start Weight</p>
            <p className="text-xl font-bold">{firstWeight?.toFixed(1)} lb</p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border text-center">
            <p className="text-xs text-muted mb-1">Latest</p>
            <p className="text-xl font-bold">{latestWeight?.toFixed(1)} lb</p>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border text-center">
            <p className="text-xs text-muted mb-1">Total Change</p>
            <p className={`text-xl font-bold ${weightChange <= 0 ? "text-green-400" : "text-red-400"}`}>
              {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} lb
            </p>
          </div>
        </div>
      )}

      {/* Weight Trend */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Bodyweight Trend (90 days)</h2>
        <WeightChart data={weightChartData} />
      </div>

      {/* Macros Overview */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Weekly Macro Average</h2>
        {weeklyMacros ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">Calories</span>
              <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(pct(weeklyMacros.calories, targets.calories))}`}
                  style={{ width: `${pct(weeklyMacros.calories, targets.calories)}%` }} />
              </div>
              <span className="text-sm font-mono w-20 text-right">{weeklyMacros.calories.toFixed(0)} / {targets.calories}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">Protein</span>
              <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(pct(weeklyMacros.protein, targets.protein))}`}
                  style={{ width: `${pct(weeklyMacros.protein, targets.protein)}%` }} />
              </div>
              <span className="text-sm font-mono w-20 text-right">{weeklyMacros.protein.toFixed(0)} / {targets.protein}g</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">Carbs</span>
              <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(pct(weeklyMacros.carbs, targets.carbs))}`}
                  style={{ width: `${pct(weeklyMacros.carbs, targets.carbs)}%` }} />
              </div>
              <span className="text-sm font-mono w-20 text-right">{weeklyMacros.carbs.toFixed(0)} / {targets.carbs}g</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium w-16">Fat</span>
              <div className="flex-1 h-3 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor(pct(weeklyMacros.fat, targets.fat))}`}
                  style={{ width: `${pct(weeklyMacros.fat, targets.fat)}%` }} />
              </div>
              <span className="text-sm font-mono w-20 text-right">{weeklyMacros.fat.toFixed(0)} / {targets.fat}g</span>
            </div>
          </div>
        ) : (
          <p className="text-muted text-center py-4">No food data logged yet</p>
        )}
      </div>

      {/* Daily Macros Table */}
      {dailyMacros.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="font-semibold mb-4">Daily Macros (Last 14 Days)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right">Cal</th>
                  <th className="text-right">Protein</th>
                  <th className="text-right">Carbs</th>
                  <th className="text-right">Fat</th>
                </tr>
              </thead>
              <tbody>
                {dailyMacros.slice(0, 14).map((d) => (
                  <tr key={d.date} className="border-b border-border/30 last:border-0">
                    <td className="py-2">{new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="text-right font-mono">{d.calories}</td>
                    <td className="text-right font-mono">{d.protein.toFixed(0)}g</td>
                    <td className="text-right font-mono">{d.carbs.toFixed(0)}g</td>
                    <td className="text-right font-mono">{d.fat.toFixed(0)}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Volume Chart */}
      {Object.keys(volumeData).length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="font-semibold mb-4">Recent Volume by Exercise</h2>
          <VolumeChart data={Object.entries(volumeData).map(([exercise, data]) => ({ exercise, ...data }))} />
        </div>
      )}
    </main>
  );
}
