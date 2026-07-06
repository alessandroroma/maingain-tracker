import { NextResponse } from "next/server";

// Starts the WHOOP OAuth flow: visit /api/whoop/auth once in a browser,
// authorize, and the callback route stores the tokens.

export async function GET(request: Request) {
  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "WHOOP_CLIENT_ID not configured" }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();

  const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `${origin}/api/whoop/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "read:recovery read:sleep read:cycles read:profile offline");
  authUrl.searchParams.set("state", state);

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    path: "/api/whoop",
  });
  return res;
}
