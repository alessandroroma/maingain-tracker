"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface VolumeData {
  exercise: string;
  volume: number;
  sets: number;
  bestWeight: number;
}

interface VolumeChartProps {
  data: VolumeData[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-muted py-8">
        Log some workouts to see volume data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="exercise" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0" }} />
        <Legend />
        <Bar dataKey="volume" fill="#3b82f6" name="Volume (lbs)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="bestWeight" fill="#22c55e" name="Best Weight (lbs)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
