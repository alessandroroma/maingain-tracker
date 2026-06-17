import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, meal_type, name, calories, protein, carbs, fat } = body;

    const { data, error } = await supabase
      .from("food_logs")
      .insert({ date, meal_type, name, calories, protein, carbs, fat })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
