"use client";

import { useState } from "react";

export function BodyLogForm({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bodyweight, setBodyweight] = useState("");
  const [waist, setWaist] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/body-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, bodyweight: parseFloat(bodyweight), waist: waist ? parseFloat(waist) : null, notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDate(new Date().toISOString().split("T")[0]);
      setBodyweight("");
      setWaist("");
      setNotes("");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Failed to log body weight:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-muted mb-1">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
          className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted mb-1">Bodyweight (lb)</label>
          <input type="number" step="0.1" placeholder="e.g. 185.5" value={bodyweight} onChange={(e) => setBodyweight(e.target.value)} required
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Waist (in)</label>
          <input type="number" step="0.1" placeholder="e.g. 34.5" value={waist} onChange={(e) => setWaist(e.target.value)}
            className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full bg-card border border-border rounded px-3 py-2 text-foreground" />
      </div>
      <button type="submit" disabled={submitting}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded transition">
        {submitting ? "Saving..." : "Log Bodyweight"}
      </button>
    </form>
  );
}
