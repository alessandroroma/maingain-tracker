import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Pulls daily readiness, sleep score, and sleep-session details from the
// Oura v2 API and upserts one recovery_logs row per day (source: 'oura').
// Runs on a daily Vercel cron; can also be triggered manually with ?days=N.

const OURA = "https://api.ouraring.com/v2/usercollection";

interface DayRow {
  date: string;
  source: "oura";
  readiness: number | null;
  sleep_score: number | null;
  sleep_hours: number | null;
  hrv: number | null;
  resting_hr: number | null;
}

async function ouraGet(path: string, token: string, start: string, end: string) {
  const res = await fetch(`${OURA}/${path}?start_date=${start}&end_date=${end}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("Oura token rejected (401) — check OURA_PAT");
  if (!res.ok) throw new Error(`Oura ${path} returned ${res.status}`);
  const body = await res.json();
  return body.data || [];
}

export async function GET(request: Request) {
  try {
    const token = process.env.OURA_PAT;
    if (!token) {
      return NextResponse.json({ error: "OURA_PAT not configured" }, { status: 503 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7")));

    const end = new Date();
    end.setDate(end.getDate() + 1); // include today
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const [readiness, dailySleep, sessions] = await Promise.all([
      ouraGet("daily_readiness", token, startStr, endStr),
      ouraGet("daily_sleep", token, startStr, endStr),
      ouraGet("sleep", token, startStr, endStr),
    ]);

    const byDate: Record<string, DayRow> = {};
    const row = (day: string): DayRow => {
      if (!byDate[day]) {
        byDate[day] = { date: day, source: "oura", readiness: null, sleep_score: null, sleep_hours: null, hrv: null, resting_hr: null };
      }
      return byDate[day];
    };

    for (const r of readiness) {
      if (r.day && r.score != null) row(r.day).readiness = Math.round(r.score);
    }
    for (const s of dailySleep) {
      if (s.day && s.score != null) row(s.day).sleep_score = Math.round(s.score);
    }
    // Sleep sessions: keep the longest session per day (ignores naps)
    const longest: Record<string, { duration: number; hrv: number | null; rhr: number | null }> = {};
    for (const s of sessions) {
      const dur = s.total_sleep_duration || 0;
      if (!s.day || dur === 0) continue;
      if (!longest[s.day] || dur > longest[s.day].duration) {
        longest[s.day] = { duration: dur, hrv: s.average_hrv ?? null, rhr: s.lowest_heart_rate ?? null };
      }
    }
    for (const [day, s] of Object.entries(longest)) {
      const r = row(day);
      r.sleep_hours = Math.round((s.duration / 3600) * 10) / 10;
      r.hrv = s.hrv != null ? Math.round(s.hrv) : null;
      r.resting_hr = s.rhr != null ? Math.round(s.rhr) : null;
    }

    const rows = Object.values(byDate);
    if (rows.length === 0) {
      return NextResponse.json({ synced: 0, message: "No Oura data in range" });
    }

    const { error } = await supabase
      .from("recovery_logs")
      .upsert(rows, { onConflict: "date,source" });
    if (error) throw new Error(error.message);

    return NextResponse.json({ synced: rows.length, from: startStr, to: endStr });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
