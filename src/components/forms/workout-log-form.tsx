"use client";

import { useState } from "react";
import { WorkoutSetRow } from "./workout-set-row";

type SetData = { weight: string; reps: string; rpe: string; rir: string };

const DEFAULT_EXERCISES = [
  "Chest Press", "Lat Pulldown", "Shoulder Press", "Chest-Supported Row",
  "Lateral Raise", "Curl", "Tricep Pushdown", "Smith Squat", "Leg Press",
  "Hamstring Curl", "Leg Extension", "Calf Raise", "Incline Chest Press",
  "MTS Pulldown", "Cable Row", "Rear Delt Fly", "Tricep Extension", "Walking Lunge",
];

const WORKOUT_NAMES = ["Upper A", "Lower A", "Upper B", "Lower B"];

export function WorkoutLogForm({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [workoutName, setWorkoutName] = useState("Upper A");
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState<SetData[]>([{ weight: "", reps: "", rpe: "", rir: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [savedExercises, setSavedExercises] = useState<string[]>(DEFAULT_EXERCISES);

  function addSet() {
    setSets((prev) => [...prev, { weight: "", reps: "", rpe: "", rir: "" }]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSet(index: number, field: keyof SetData, value: string) {
    setSets((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (exercise && !savedExercises.includes(exercise)) {
      setSavedExercises((prev) => [...prev, exercise]);
      setExercise("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, name: workoutName, exercise, sets }),
      });
      setSets([{ weight: "", reps: "", rpe: "", rir: "" }]);
      onSuccess?.();
    } catch {
      console.error("Failed to log workout");
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
          <label className="block text-sm text-muted mb-1">Workout</label>
          <select value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground">
            {WORKOUT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted mb-1">Exercise</label>
        <div className="flex gap-2">
          <select value={exercise} onChange={(e) => setExercise(e.target.value)}
            className="flex-1 bg-card border border-border rounded px-3 py-2 text-foreground">
            <option value="">Select exercise...</option>
            {savedExercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-6 gap-2 text-xs text-muted">
          <span>#</span><span>Weight</span><span>Reps</span><span>RPE</span><span>RIR</span><span></span>
        </div>
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-end">
            <WorkoutSetRow setNumber={i + 1} weight={s.weight} reps={s.reps} rpe={s.rpe} rir={s.rir}
              onWeightChange={(v) => updateSet(i, "weight", v)}
              onRepsChange={(v) => updateSet(i, "reps", v)}
              onRpeChange={(v) => updateSet(i, "rpe", v)}
              onRirChange={(v) => updateSet(i, "rir", v)} />
          </div>
        ))}
        <button type="button" onClick={addSet}
          className="text-sm text-primary hover:underline">+ Add set</button>
      </div>

      <button type="submit" disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded transition">
        {submitting ? "Saving..." : "Log Workout"}
      </button>
    </form>
  );
}
