"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: DataPoint[];
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length < 2) {
    return (
      <div className="text-center text-muted py-8">
        Need at least 2 data points to show trends
      </div>
    );
  }

  // Sort chronologically and compute a rolling 7-day average
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map((point, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    const avg7 = window.reduce((s, p) => s + p.weight, 0) / window.length;
    return { ...point, avg7: Math.round(avg7 * 10) / 10 };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0" }} />
        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Weight (lb)" />
        <Line type="monotone" dataKey="avg7" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="7-Day Avg" />
      </LineChart>
    </ResponsiveContainer>
  );
}
