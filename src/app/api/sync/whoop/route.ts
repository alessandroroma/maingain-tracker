import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

// Pulls recovery + sleep from the WHOOP v2 API and upserts one
// recovery_logs row per day (source: 'whoop'). Runs on a daily Vercel
// cron; can also be triggered manually with ?days=N.
//
// WHOOP rotates refresh tokens: every refresh returns a NEW refresh token
// and invalidates the old one, so the new pair is saved before anything else.

const WHOOP = "https://api.prod.whoop.com/developer/v2";

interface DayRow {
  date: string;
  source: "whoop";
  readiness: number | null;
  sleep_score: number | null;
  sleep_hours: number | null;
  hrv: number | null;
  resting_hr: number | null;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase
    .from("integration_tokens")
    .select("*")
    .eq("provider", "whoop")
    .single();
  if (error || !data) throw new Error("WHOOP not connected — visit /api/whoop/auth to authorize");

  // Refresh if the token expires within 2 minutes
  if (new Date(data.expires_at).getTime() - Date.now() > 120_000) {
    return data.access_token;
  }

  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refresh_token,
      client_id: process.env.WHOOP_CLIENT_ID || "",
      client_secret: process.env.WHOOP_CLIENT_SECRET || "",
      scope: "offline",
    }),
  });
  const tokens = await res.json();
  if (!res.ok) {
    throw new Error(
      `WHOOP token refresh failed (${tokens.error_description || tokens.error || res.status}) — re-authorize at /api/whoop/auth`
    );
  }

  const { error: saveErr } = await supabase.from("integration_tokens").upsert({
    provider: "whoop",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (saveErr) throw new Error(`Failed to store rotated tokens: ${saveErr.message}`);

  return tokens.access_token;
}

// Paginated GET across WHOOP collection endpoints
async function whoopRecords(path: string, token: string, start: string, end: string) {
  const records: Record<string, unknown>[] = [];
  let nextToken: string | null = null;
  for (let page = 0; page < 5; page++) {
    const url = new URL(`${WHOOP}/${path}`);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    url.searchParams.set("limit", "25");
    if (nextToken) url.searchParams.set("nextToken", nextToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401) throw new Error("WHOOP token rejected — re-authorize at /api/whoop/auth");
    if (!res.ok) throw new Error(`WHOOP ${path} returned ${res.status}`);
    const body = await res.json();
    records.push(...(body.records || []));
    nextToken = body.next_token || null;
    if (!nextToken) break;
  }
  return records;
}

export async function GET(request: Request) {
  try {
    if (!process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_CLIENT_SECRET) {
      return NextResponse.json({ error: "WHOOP credentials not configured" }, { status: 503 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7")));

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const token = await getAccessToken();

    const [sleeps, recoveries] = await Promise.all([
      whoopRecords("activity/sleep", token, startIso, endIso),
      whoopRecords("recovery", token, startIso, endIso),
    ]);

    const byDate: Record<string, DayRow> = {};
    const row = (day: string): DayRow => {
      if (!byDate[day]) {
        byDate[day] = { date: day, source: "whoop", readiness: null, sleep_score: null, sleep_hours: null, hrv: null, resting_hr: null };
      }
      return byDate[day];
    };

    // Sleep: keyed by the date the sleep ended (i.e. the morning). Skip naps.
    const sleepDateById: Record<string, string> = {};
    for (const s of sleeps as {
      id?: string;
      nap?: boolean;
      end?: string;
      score?: {
        sleep_performance_percentage?: number;
        stage_summary?: {
          total_light_sleep_time_milli?: number;
          total_slow_wave_sleep_time_milli?: number;
          total_rem_sleep_time_milli?: number;
        };
      };
    }[]) {
      if (s.nap || !s.end) continue;
      const day = s.end.split("T")[0];
      if (s.id) sleepDateById[s.id] = day;
      const r = row(day);
      if (s.score?.sleep_performance_percentage != null) {
        r.sleep_score = Math.round(s.score.sleep_performance_percentage);
      }
      const st = s.score?.stage_summary;
      if (st) {
        const ms =
          (st.total_light_sleep_time_milli || 0) +
          (st.total_slow_wave_sleep_time_milli || 0) +
          (st.total_rem_sleep_time_milli || 0);
        if (ms > 0) r.sleep_hours = Math.round((ms / 3600000) * 10) / 10;
      }
    }

    // Recovery: attach to the linked sleep's date; fall back to created_at.
    for (const rec of recoveries as {
      sleep_id?: string;
      created_at?: string;
      score?: { recovery_score?: number; hrv_rmssd_milli?: number; resting_heart_rate?: number };
    }[]) {
      const day =
        (rec.sleep_id && sleepDateById[rec.sleep_id]) ||
        rec.created_at?.split("T")[0];
      if (!day || !rec.score) continue;
      const r = row(day);
      if (rec.score.recovery_score != null) r.readiness = Math.round(rec.score.recovery_score);
      if (rec.score.hrv_rmssd_milli != null) r.hrv = Math.round(rec.score.hrv_rmssd_milli);
      if (rec.score.resting_heart_rate != null) r.resting_hr = Math.round(rec.score.resting_heart_rate);
    }

    const rows = Object.values(byDate);
    if (rows.length === 0) {
      return NextResponse.json({ synced: 0, message: "No WHOOP data in range" });
    }

    const { error } = await supabase
      .from("recovery_logs")
      .upsert(rows, { onConflict: "date,source" });
    if (error) throw new Error(error.message);

    return NextResponse.json({ synced: rows.length, from: startIso.split("T")[0], to: endIso.split("T")[0] });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
