"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WeightChart } from "@/components/charts/weight-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { MacroDonut } from "@/components/charts/macro-donut";

export default function ProgressPage() {
  const [bodylogs, setBodyLogs] = useState<unknown[]>([]);
  const [volumeData, setVolumeData] = useState<Record<string, { volume: number; sets: number; bestWeight: number }>>({});
  const [todayMacros, setTodayMacros] = useState({ protein: 0, carbs: 0, fat: 0, calories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const today = new Date().toISOString().split("T")[0];

        const { data: logs } = await supabase
          .from("body_logs")
          .select("*")
          .order("date", { ascending: true })
          .limit(90);
        if (logs) setBodyLogs(logs);

        // Volume by exercise
        const { data: sets } = await supabase
          .from("workout_sets")
          .select("exercise_id, weight, reps")
          .order("date", { ascending: false })
          .limit(100);

        if (sets) {
          const byEx: Record<string, number[]> = {};
          sets.forEach((s) => {
            const vol = (s.weight || 0) * (s.reps || 0);
            byEx[s.exercise_id] = [...(byEx[s.exercise_id] || []), vol];
          });
          const chartData = Object.entries(byEx).map(([id, vols]) => {
            const bestWeight = Math.max(...vols.map((v, i) => {
              const s = (sets as Array<{ exercise_id: string; weight: number; reps: number }>).find((x) => x.exercise_id === id && (x.weight || 0) * (x.reps || 0) === v);
              return s?.weight || 0;
            }));
            return { exercise: id, volume: Math.max(...vols), sets: vols.length, bestWeight };
          });
          setVolumeData(chartData as unknown as Record<string, { volume: number; sets: number; bestWeight: number }>);
        }

        // Today's macros
        const { data: foods } = await supabase
          .from("food_logs")
          .select("calories, protein, carbs, fat")
          .eq("date", today);
        if (foods) {
          setTodayMacros({
            calories: foods.reduce((s, f) => s + (f.calories || 0), 0),
            protein: foods.reduce((s, f) => s + (f.protein || 0), 0),
            carbs: foods.reduce((s, f) => s + (f.carbs || 0), 0),
            fat: foods.reduce((s, f) => s + (f.fat || 0), 0),
          });
        }
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 text-center text-muted">Loading...</main>
    );
  }

  const weightChartData = (bodylogs as Array<{ date: string; bodyweight: number }>).map((l) => ({
    date: l.date,
    weight: l.bodyweight,
    avg7: 0,
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Bodyweight Trend</h2>
        <WeightChart data={weightChartData} />
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Today&apos;s Macros</h2>
        <MacroDonut
          calories={todayMacros.calories}
          protein={todayMacros.protein}
          carbs={todayMacros.carbs}
          fat={todayMacros.fat}
          targets={{ protein: 190, carbs: 275, fat: 75 }}
        />
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Recent Volume by Exercise</h2>
        <VolumeChart data={Object.entries(volumeData).map(([exercise, data]) => ({ exercise, ...data }))} />
      </div>
    </main>
  );
}
