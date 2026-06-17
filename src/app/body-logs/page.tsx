"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface BodyLog {
  id: string;
  date: string;
  bodyweight: number;
  waist: number | null;
  notes?: string;
}

export default function BodyLogPage() {
  const [logs, setLogs] = useState<BodyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("body_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(200);

      if (fetchErr) throw fetchErr;
      if (data) setLogs(data as BodyLog[]);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteLog(id: string) {
    if (!confirm("Delete this bodyweight log?")) return;
    try {
      await fetch(`/api/body-logs?id=${id}`, { method: "DELETE" });
      loadLogs();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  }

  // Calculate trend
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = sorted.length > 0 ? sorted[sorted.length - 1].bodyweight : null;
  const firstWeight = sorted.length > 0 ? sorted[0].bodyweight : null;
  const totalChange = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  // Weekly avg
  const weeklyAvg = (() => {
    if (sorted.length === 0) return null;
    return sorted.reduce((s, l) => s + l.bodyweight, 0) / sorted.length;
  })();

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bodyweight Log</h1>
        <button onClick={loadLogs} disabled={loading}
          className="text-xs text-muted hover:text-foreground transition disabled:opacity-50">
          {loading ? "↻" : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card p-3 rounded-lg border border-border text-center">
            <p className="text-xs text-muted">Latest</p>
            <p className="text-lg font-bold">{latestWeight?.toFixed(1)} lb</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border text-center">
            <p className="text-xs text-muted">Total Change</p>
            <p className={`text-lg font-bold ${totalChange && totalChange <= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalChange != null ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}` : "—"}
            </p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border text-center">
            <p className="text-xs text-muted">Avg</p>
            <p className="text-lg font-bold">{weeklyAvg?.toFixed(1)} lb</p>
          </div>
        </div>
      )}

      {/* Log form */}
      <div className="bg-card p-5 rounded-lg border border-border">
        <h2 className="font-semibold mb-3">Log Bodyweight</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const date = (form.elements.namedItem("date") as HTMLInputElement).value;
          const weight = parseFloat((form.elements.namedItem("weight") as HTMLInputElement).value);
          const waist = parseFloat((form.elements.namedItem("waist") as HTMLInputElement).value) || null;

          if (!date || !weight) return;

          try {
            await fetch("/api/body-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date, bodyweight: weight, waist }),
            });
            form.reset();
            loadLogs();
          } catch (err: unknown) {
            setError((err as Error).message);
          }
        }} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Date</label>
            <input type="date" name="date" defaultValue={new Date().toISOString().split("T")[0]}
              className="bg-background border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Weight (lb)</label>
            <input type="number" step="0.1" name="weight" placeholder="185.0" required
              className="bg-background border border-border rounded px-3 py-2 text-foreground w-28" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Waist (in, optional)</label>
            <input type="number" step="0.1" name="waist" placeholder="34.0"
              className="bg-background border border-border rounded px-3 py-2 text-foreground w-24" />
          </div>
          <button type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition">
            Add
          </button>
        </form>
      </div>

      {/* History */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-5 h-5 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
          <p className="text-muted mt-2 text-sm">Loading...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {logs.map((log, i) => (
            <div key={log.id} className={`flex justify-between items-center px-4 py-3 ${i < logs.length - 1 ? "border-b border-border/50" : ""}`}>
              <div>
                <span className="font-medium">{new Date(log.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                {log.waist != null && <span className="text-muted ml-2">{log.waist.toFixed(1)} in waist</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold">{log.bodyweight.toFixed(1)} lb</span>
                <button onClick={() => deleteLog(log.id)}
                  className="text-red-400/70 hover:text-red-400 transition text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card p-10 rounded-lg border border-border text-center">
          <p className="text-muted">No bodyweight logs yet</p>
        </div>
      )}
    </main>
  );
}
