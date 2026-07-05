import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const exerciseId = searchParams.get("exercise_id");
    const limit = searchParams.get("limit");

    let query = supabase
      .from("workouts")
      .select(`*, workout_sets(*)`)
      .order("date", { ascending: false });

    if (date) query = query.eq("date", date);
    if (exerciseId) query = query.in("workout_sets.exercise_id", [exerciseId]);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { date, name, exercise, sets } = body;

    if (!exercise || !sets || sets.length === 0) {
      return NextResponse.json({ error: "Exercise and sets are required" }, { status: 400 });
    }

    const { data: ex } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", exercise)
      .limit(1);

    let exerciseId = ex?.[0]?.id;
    if (!exerciseId) {
      const { data: newEx } = await supabase
        .from("exercises")
        .insert({ name: exercise, muscle_group: "general", equipment: "general" })
        .select("id")
        .single();
      exerciseId = newEx?.id;
    }
    if (!exerciseId) throw new Error("Failed to get exercise ID");

    const { data: workout } = await supabase
      .from("workouts")
      .insert({ date, name })
      .select("id")
      .single();

    if (!workout?.id) throw new Error("Failed to create workout");

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

export async function DELETE(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Delete sets first, then workout (or use cascade if available)
    await supabase.from("workout_sets").delete().eq("workout_id", id);
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
