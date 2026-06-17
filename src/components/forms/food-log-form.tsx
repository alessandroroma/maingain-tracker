"use client";

import { useState } from "react";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function FoodLogForm({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mealType, setMealType] = useState("breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/food-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, meal_type: mealType, name: foodName,
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
        }),
      });
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      onSuccess?.();
    } catch {
      console.error("Failed to log food");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Meal</label>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground">
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Food name</label>
        <input type="text" placeholder="e.g. Chicken breast" value={foodName} onChange={(e) => setFoodName(e.target.value)} required
          className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-muted mb-1">Cal</label>
          <input type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)}
            className="w-full bg-card border border-border rounded px-2 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Protein (g)</label>
          <input type="number" placeholder="g" value={protein} onChange={(e) => setProtein(e.target.value)}
            className="w-full bg-card border border-border rounded px-2 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Carbs (g)</label>
          <input type="number" placeholder="g" value={carbs} onChange={(e) => setCarbs(e.target.value)}
            className="w-full bg-card border border-border rounded px-2 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Fat (g)</label>
          <input type="number" placeholder="g" value={fat} onChange={(e) => setFat(e.target.value)}
            className="w-full bg-card border border-border rounded px-2 py-2 text-foreground" />
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded transition">
        {submitting ? "Saving..." : "Log Food"}
      </button>
    </form>
  );
}
