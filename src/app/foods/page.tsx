"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
}

export default function FoodsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [serving, setServing] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    const { data } = await supabase.from("food_items").select("*").order("name");
    if (data) setFoods(data);
    setLoading(false);
  }

  async function saveFood(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("food_items").insert({
      name, calories: parseInt(calories) || 0, protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0, fat: parseInt(fat) || 0, serving_size: serving || null,
    });
    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setServing("");
    setShowForm(false);
    loadFoods();
  }

  async function deleteFood(id: string) {
    await supabase.from("food_items").delete().eq("id", id);
    loadFoods();
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Saved Foods</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition">
          {showForm ? "Cancel" : "+ Add Food"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveFood} className="bg-card p-6 rounded-lg border border-border space-y-3">
          <input type="text" placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground" />
          <div className="grid grid-cols-4 gap-2">
            <input type="number" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)}
              className="bg-background border border-border rounded px-2 py-2 text-foreground" />
            <input type="number" placeholder="P(g)" value={protein} onChange={(e) => setProtein(e.target.value)}
              className="bg-background border border-border rounded px-2 py-2 text-foreground" />
            <input type="number" placeholder="C(g)" value={carbs} onChange={(e) => setCarbs(e.target.value)}
              className="bg-background border border-border rounded px-2 py-2 text-foreground" />
            <input type="number" placeholder="F(g)" value={fat} onChange={(e) => setFat(e.target.value)}
              className="bg-background border border-border rounded px-2 py-2 text-foreground" />
          </div>
          <input type="text" placeholder="Serving size (optional)" value={serving} onChange={(e) => setServing(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-foreground" />
          <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded transition">
            Save Food
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted text-center py-8">Loading...</p>
      ) : foods.length === 0 ? (
        <p className="text-muted text-center py-8">No saved foods yet. Add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {foods.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium">{f.name}</p>
                <p className="text-sm text-muted">
                  {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g F
                  {f.serving_size ? ` · ${f.serving_size}` : ""}
                </p>
              </div>
              <button onClick={() => deleteFood(f.id)}
                className="text-red-400 hover:text-red-300 text-sm px-2">Delete</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
