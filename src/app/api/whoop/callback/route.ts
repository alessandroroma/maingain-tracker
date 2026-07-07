import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

// OAuth callback: exchanges the authorization code for tokens and stores
// them in integration_tokens. WHOOP rotates refresh tokens, so the sync
// route re-saves the pair on every refresh.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.json({ error: `WHOOP authorization failed: ${oauthError}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const cookieState = request.headers
    .get("cookie")
    ?.match(/whoop_oauth_state=([^;]+)/)?.[1];
  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ error: "State mismatch — restart at /api/whoop/auth" }, { status: 400 });
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "WHOOP credentials not configured" }, { status: 503 });
  }

  try {
    const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${url.origin}/api/whoop/callback`,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokens.error_description || tokens.error || `Token exchange failed (${tokenRes.status})`);
    }

    const { error } = await supabase.from("integration_tokens").upsert({
      provider: "whoop",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Failed to store tokens: ${error.message}`);

    const res = NextResponse.redirect(`${url.origin}/dashboard?whoop=connected`);
    res.cookies.delete("whoop_oauth_state");
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
