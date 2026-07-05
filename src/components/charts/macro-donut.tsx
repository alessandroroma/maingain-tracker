"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface MacroData {
  name: string;
  value: number;
  color: string;
}

interface MacroDonutProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  targets?: { protein: number; carbs: number; fat: number };
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export function MacroDonut({ calories, protein, carbs, fat, targets }: MacroDonutProps) {
  const data: MacroData[] = [
    { name: "Protein", value: protein, color: COLORS[1] },
    { name: "Carbs", value: carbs, color: COLORS[2] },
    { name: "Fat", value: fat, color: COLORS[3] },
  ];

  const total = protein * 4 + carbs * 4 + fat * 9;
  const pct = total > 0 ? ((total / calories) * 100).toFixed(0) : "0";

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 text-sm">
        <p className="text-muted">Macros from {calories} kcal</p>
        <p><span className="text-green-400">Protein:</span> {protein}g {targets ? `(${((protein * 4 / calories) * 100).toFixed(0)}%)` : ""}</p>
        <p><span className="text-yellow-400">Carbs:</span> {carbs}g {targets ? `(${((carbs * 4 / calories) * 100).toFixed(0)}%)` : ""}</p>
        <p><span className="text-red-400">Fat:</span> {fat}g {targets ? `(${((fat * 9 / calories) * 100).toFixed(0)}%)` : ""}</p>
        <p className="text-muted text-xs">Macro split: {pct}% (should be ~100%)</p>
        {targets && (
          <div className="pt-2 border-t border-border">
            <p className="text-muted">Targets</p>
            <p>P: {targets.protein}g | C: {targets.carbs}g | F: {targets.fat}g</p>
          </div>
        )}
      </div>
    </div>
  );
}
