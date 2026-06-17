import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const days = searchParams.get("days");

    if (days) {
      // Fetch daily totals for the last N days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(days));

      const { data, error } = await supabase
        .from("food_logs")
        .select("date, calories, protein, carbs, fat, name, meal_type")
        .gte("date", startDate.toISOString().split("T")[0])
        .lt("date", endDate.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) throw error;

      // Calculate daily totals
      const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number; items: number }> = {};
      (data || []).forEach((f) => {
        if (!dailyTotals[f.date]) {
          dailyTotals[f.date] = { calories: 0, protein: 0, carbs: 0, fat: 0, items: 0 };
        }
        dailyTotals[f.date].calories += f.calories || 0;
        dailyTotals[f.date].protein += f.protein || 0;
        dailyTotals[f.date].carbs += f.carbs || 0;
        dailyTotals[f.date].fat += f.fat || 0;
        dailyTotals[f.date].items += 1;
      });

      return NextResponse.json({
        dailyTotals,
        totalItems: (data || []).length,
      });
    }

    // Single date or all logs
    let query = supabase.from("food_logs").select("*").order("date", { ascending: false }).limit(200);
    if (date) query = query.eq("date", date);

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
    const { date, meal_type, name, calories, protein, carbs, fat } = body;

    if (!date || !name) {
      return NextResponse.json({ error: "Date and food name are required" }, { status: 400 });
    }

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
