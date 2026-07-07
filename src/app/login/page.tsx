"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }
    // Full navigation so the middleware sees the fresh session cookies
    window.location.href = "/dashboard";
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-24">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h1 className="text-xl font-bold mb-1">🐚 Maingain</h1>
        <p className="text-sm text-muted mb-6">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              autoComplete="email"
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground" />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              autoComplete="current-password"
              className="w-full bg-background border border-border rounded px-3 py-2 text-foreground" />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded transition">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
