"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WeightChart } from "@/components/charts/weight-chart";
import { BodyLogForm } from "@/components/forms/body-log-form";

export default function DashboardPage() {
  const [bodylogs, setBodyLogs] = useState<unknown[]>([]);
  const [foodTotals, setFoodTotals] = useState<{ calories: number; protein: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const today = new Date().toISOString().split("T")[0];

      const { data: logs } = await supabase
        .from("body_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);
      if (logs) setBodyLogs(logs);

      const { data: foods } = await supabase
        .from("food_logs")
        .select("calories, protein")
        .eq("date", today);
      if (foods) {
        setFoodTotals({
          calories: foods.reduce((s, f) => s + (f.calories || 0), 0),
          protein: foods.reduce((s, f) => s + (f.protein || 0), 0),
        });
      }
    }
    fetchData();
  }, []);

  const weightData = (bodylogs as Array<{ date: string; bodyweight: number }>).map((l) => ({
    date: l.date,
    weight: l.bodyweight,
    avg7: 0,
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Today&apos;s Calories</h2>
          <p className="text-2xl font-bold">{foodTotals?.calories ?? "—"}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Today&apos;s Protein</h2>
          <p className="text-2xl font-bold">{foodTotals?.protein ?? "—"} g</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Latest Weight</h2>
          <p className="text-2xl font-bold">
            {(bodylogs as Array<{ bodyweight: number }>)?.[0]?.bodyweight?.toFixed(1) ?? "—"} lb
          </p>
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
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-muted">Weekly weight change</span><span>—</span></li>
            <li className="flex justify-between"><span className="text-muted">Latest waist</span><span>—</span></li>
            <li className="flex justify-between"><span className="text-muted">Next workout</span><span>—</span></li>
            <li className="flex justify-between"><span className="text-muted">Calorie rec.</span><span>—</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
