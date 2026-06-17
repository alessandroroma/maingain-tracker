import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, name, exercise, sets } = body;

    if (!exercise || !sets || sets.length === 0) {
      return NextResponse.json({ error: "Exercise and sets are required" }, { status: 400 });
    }

    // Upsert exercise
    const { data: ex } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", exercise)
      .limit(1);

    let exerciseId = ex?.[0]?.id;
    if (!exerciseId) {
      const { data: newEx } = await supabase
        .from("exercises")
        .insert({ name, muscle_group: "general", equipment: "general" })
        .select("id")
        .single();
      exerciseId = newEx?.id;
    }
    if (!exerciseId) throw new Error("Failed to get exercise ID");

    // Create workout
    const { data: workout } = await supabase
      .from("workouts")
      .insert({ date, name })
      .select("id")
      .single();

    if (!workout?.id) throw new Error("Failed to create workout");

    // Create sets
    const workoutSets = sets.map((s: Record<string, string>, i: number) => ({
      workout_id: workout.id,
      exercise_id: exerciseId,
      set_number: i + 1,
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0,
      rpe: s.rpe ? parseFloat(s.rpe) : null,
      rir: s.rir ? parseFloat(s.rir) : null,
    }));

    await supabase.from("workout_sets").insert(workoutSets);

    return NextResponse.json({ workout_id: workout.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
