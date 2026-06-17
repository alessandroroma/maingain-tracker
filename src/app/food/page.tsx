"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FoodLogForm } from "@/components/forms/food-log-form";

interface FoodLog {
  id: string;
  date: string;
  meal_type: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
}

export default function FoodPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [savedFoods, setSavedFoods] = useState<FoodItem[]>([]);
  const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const targets = { calories: 2700, protein: 190, carbs: 275, fat: 75 };

  useEffect(() => {
    loadToday();
    loadSavedFoods();
  }, []);

  async function loadToday() {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("date", today)
      .order("meal_type");
    if (data) {
      setLogs(data);
      setTodayTotals({
        calories: data.reduce((s, f) => s + (f.calories || 0), 0),
        protein: data.reduce((s, f) => s + (f.protein || 0), 0),
        carbs: data.reduce((s, f) => s + (f.carbs || 0), 0),
        fat: data.reduce((s, f) => s + (f.fat || 0), 0),
      });
    }
    setLoading(false);
  }

  async function loadSavedFoods() {
    const { data } = await supabase.from("food_items").select("*").order("name");
    if (data) setSavedFoods(data);
  }

  async function deleteLog(id: string) {
    await supabase.from("food_logs").delete().eq("id", id);
    loadToday();
  }

  async function useSavedFood(food: FoodItem) {
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("food_logs").insert({
      date: today,
      meal_type: "snack",
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
    loadToday();
  }

  const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
  const groupedByMeal = mealOrder.map(meal => ({
    meal,
    items: logs.filter(l => l.meal_type === meal),
  })).filter(g => g.items.length > 0);

  const pct = (val: number, target: number) => Math.min(100, Math.round((val / target) * 100));
  const barColor = (p: number) => p >= 100 ? "bg-green-500" : p >= 80 ? "bg-blue-500" : p >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Food Log</h1>

      {/* Macro Summary */}
      <div className="bg-card p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Today&apos;s Macros</h2>
          <button onClick={() => loadToday()} disabled={refreshing}
            className="text-xs text-muted hover:text-foreground transition">
            {refreshing ? "↻" : "↻ Refresh"}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold">{todayTotals.calories}</p>
            <p className="text-xs text-muted">kcal / {targets.calories}</p>
            <div className="h-1.5 bg-border rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(pct(todayTotals.calories, targets.calories))}`}
                style={{ width: `${pct(todayTotals.calories, targets.calories)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{todayTotals.protein}g</p>
            <p className="text-xs text-muted">protein / {targets.protein}g</p>
            <div className="h-1.5 bg-border rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(pct(todayTotals.protein, targets.protein))}`}
                style={{ width: `${pct(todayTotals.protein, targets.protein)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{todayTotals.carbs}g</p>
            <p className="text-xs text-muted">carbs / {targets.carbs}g</p>
            <div className="h-1.5 bg-border rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(pct(todayTotals.carbs, targets.carbs))}`}
                style={{ width: `${pct(todayTotals.carbs, targets.carbs)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{todayTotals.fat}g</p>
            <p className="text-xs text-muted">fat / {targets.fat}g</p>
            <div className="h-1.5 bg-border rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor(pct(todayTotals.fat, targets.fat))}`}
                style={{ width: `${pct(todayTotals.fat, targets.fat)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Saved Foods Quick Add */}
      {savedFoods.length > 0 && (
        <div className="bg-card p-5 rounded-lg border border-border">
          <h2 className="font-semibold mb-3">Quick Add Saved Foods</h2>
          <div className="flex flex-wrap gap-2">
            {savedFoods.map((f) => (
              <button key={f.id} onClick={() => useSavedFood(f)}
                className="bg-background border border-border rounded px-3 py-1.5 text-sm hover:bg-border/50 transition text-left">
                <span className="font-medium">{f.name}</span>
                <span className="text-muted ml-1">{f.calories} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Log */}
      {loading ? (
        <p className="text-muted text-center py-8">Loading...</p>
      ) : (
        <>
          {groupedByMeal.length > 0 && (
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="font-semibold mb-3">Today&apos;s Meals</h2>
              <div className="space-y-4">
                {groupedByMeal.map(({ meal, items }) => (
                  <div key={meal}>
                    <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-2 capitalize">{meal}</h3>
                    <div className="space-y-1">
                      {items.map((log) => (
                        <div key={log.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                          <div>
                            <span className="font-medium text-sm">{log.name}</span>
                            <span className="text-xs text-muted ml-2">{log.calories} kcal</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted">
                            <span>P: {log.protein}g</span>
                            <span>C: {log.carbs}g</span>
                            <span>F: {log.fat}g</span>
                            <button onClick={() => deleteLog(log.id)}
                              className="text-red-400/70 hover:text-red-400 ml-1 transition">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Meal subtotal */}
                    <div className="flex justify-between text-xs text-muted mt-1 pt-1 border-t border-border/30">
                      <span>{items.reduce((s, i) => s + i.calories, 0)} kcal</span>
                      <span>P: {items.reduce((s, i) => s + i.protein, 0)}g</span>
                      <span>C: {items.reduce((s, i) => s + i.carbs, 0)}g</span>
                      <span>F: {items.reduce((s, i) => s + i.fat, 0)}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Food Form */}
          <div className="bg-card p-5 rounded-lg border border-border">
            <h2 className="font-semibold mb-3">Add Food</h2>
            <FoodLogForm onAdded={loadToday} />
          </div>
        </>
      )}
    </main>
  );
}
