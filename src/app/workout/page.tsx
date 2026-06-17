"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { WorkoutLogForm } from "@/components/forms/workout-log-form";

interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  exercises?: { name: string };
}

interface Workout {
  id: string;
  date: string;
  name: string;
  workout_sets: WorkoutSet[];
}

interface PreviousSet {
  date: string;
  weight: number;
  reps: number;
  exercise_id: string;
  exercises?: { name: string };
}

export default function WorkoutPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [previousSets, setPreviousSets] = useState<PreviousSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    setLoading(true);
    setError(null);
    try {
      const { data: recentWorkouts, error: fetchErr } = await supabase
        .from("workouts")
        .select(`*, workout_sets(*)`)
        .order("date", { ascending: false })
        .limit(10);

      if (fetchErr) throw fetchErr;

      if (recentWorkouts) {
        const enriched = recentWorkouts.map((w) => ({
          ...w,
          workout_sets: (w.workout_sets || []).map((ws) => ({
            ...ws,
            exercises: { name: ws.exercises?.name || "Exercise" },
          })) as WorkoutSet[],
        })) as Workout[];
        setWorkouts(enriched);

        const { data: allSets } = await supabase
          .from("workout_sets")
          .select("*, workouts(date), exercises(name)")
          .order("workout_sets.set_number", { ascending: true });

        if (allSets) setPreviousSets(allSets as unknown as PreviousSet[]);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkoutsForDate(date: string) {
    setSelectedDate(date);
    const { data } = await supabase
      .from("workouts")
      .select(`*, workout_sets(*)`)
      .eq("date", date)
      .order("name");

    if (data) {
      setWorkouts(data.map((w) => ({
        ...w,
        workout_sets: (w.workout_sets || []).map((ws) => ({
          ...ws,
          exercises: { name: ws.exercises?.name || "Exercise" },
        })) as WorkoutSet[],
      })) as Workout[]);
    }
  }

  async function deleteWorkout(id: string) {
    if (!confirm("Delete this workout and all its sets?")) return;
    setDeleting(id);
    setError(null);
    try {
      await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      loadWorkouts();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  const est1rm = (weight: number, reps: number) => {
    if (reps <= 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const groupedByDate = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    if (!acc[w.date]) acc[w.date] = [];
    acc[w.date].push(w);
    return acc;
  }, {});

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Workout Log</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Date Picker */}
      <div className="flex gap-3 items-center">
        <input type="date" value={selectedDate} onChange={(e) => loadWorkoutsForDate(e.target.value)}
          className="bg-card border border-border rounded px-3 py-2 text-foreground" />
        <button onClick={() => loadWorkouts()} disabled={loading}
          className="text-muted hover:text-foreground transition text-sm">
          {loading ? "↻" : "↻ Refresh"}
        </button>
      </div>

      {/* Recent Workouts */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
          <p className="text-muted mt-2">Loading...</p>
        </div>
      ) : (
        <>
          {Object.keys(groupedByDate).length > 0 ? (
            Object.entries(groupedByDate).map(([date, dayWorkouts]) => (
              <div key={date} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 bg-background/50 flex justify-between items-center">
                  <h2 className="font-semibold">{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</h2>
                  <span className="text-xs text-muted">{dayWorkouts.length} workout{dayWorkouts.length > 1 ? "s" : ""}</span>
                </div>
                {dayWorkouts.map((workout) => (
                  <div key={workout.id} className="px-5 py-3 border-b border-border/30 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{workout.name}</h3>
                      <button onClick={() => deleteWorkout(workout.id)}
                        disabled={deleting === workout.id}
                        className="text-xs text-red-400/60 hover:text-red-400 transition disabled:opacity-50">
                        {deleting === workout.id ? "⏳" : "Delete"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {workout.workout_sets.map((ws) => (
                        <div key={ws.id} className="flex items-center gap-2 text-sm py-1 border-t border-border/10">
                          <span className="text-muted w-6">#{ws.set_number}</span>
                          <span className="font-medium w-24 truncate">{ws.exercises?.name || "Exercise"}</span>
                          <span>{ws.weight} × {ws.reps}</span>
                          {ws.rpe && <span className="text-muted">RPE {ws.rpe}</span>}
                          {ws.rir && <span className="text-muted">RIR {ws.rir}</span>}
                          <span className="text-xs text-muted ml-1">{est1rm(ws.weight, ws.reps)} 1RM</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end text-xs text-muted mt-2">
                      Total: {workout.workout_sets.reduce((s, ws) => s + (ws.weight * ws.reps), 0).toLocaleString()} lbs
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="bg-card p-10 rounded-lg border border-border text-center">
              <p className="text-muted mb-4">No workouts logged for this date</p>
              <p className="text-xs text-muted">Log a workout below to get started</p>
            </div>
          )}

          {/* Log Workout Form */}
          <div className="bg-card p-5 rounded-lg border border-border">
            <h2 className="font-semibold mb-3">Log Workout</h2>
            <WorkoutLogForm onAdded={() => loadWorkoutsForDate(selectedDate)} />
          </div>

          {/* Previous Performance Reference */}
          {previousSets.length > 0 && (
            <div className="bg-card p-5 rounded-lg border border-border">
              <h2 className="font-semibold mb-3">Recent Lifts</h2>
              <div className="space-y-2">
                {previousSets
                  .filter((s) => {
                    const d = s.date;
                    if (!d) return false;
                    const diff = (new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
                    return diff <= 14;
                  })
                  .slice(0, 12)
                  .map((s, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                      <span className="font-medium">{s.exercises?.name || "Exercise"}</span>
                      <span>{s.weight} × {s.reps}</span>
                      <span className="text-muted">{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
