import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data: bodyLogs } = await supabase.from("body_logs").select("*").order("date");
    const { data: foodLogs } = await supabase.from("food_logs").select("*").order("date");
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*, workout_sets(*, exercises(name))");
    const { data: checkins } = await supabase.from("weekly_checkins").select("*").order("week_start");
    const { data: foodItems } = await supabase.from("food_items").select("*").order("name");

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      body_logs: bodyLogs || [],
      food_logs: foodLogs || [],
      workouts: workouts || [],
      weekly_checkins: checkins || [],
      food_items: foodItems || [],
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="maingain-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
