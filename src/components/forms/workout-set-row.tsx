"use client";

interface WorkoutSetRowProps {
  setNumber: number;
  weight: string;
  reps: string;
  rpe: string;
  rir: string;
  onWeightChange: (val: string) => void;
  onRepsChange: (val: string) => void;
  onRpeChange: (val: string) => void;
  onRirChange: (val: string) => void;
  onRemove?: () => void;
}

export function WorkoutSetRow({ setNumber, weight, reps, rpe, rir, onWeightChange, onRepsChange, onRpeChange, onRirChange, onRemove }: WorkoutSetRowProps) {
  return (
    <div className="grid grid-cols-6 gap-2 items-end">
      <span className="text-sm text-muted font-medium">{setNumber}</span>
      <div>
        <label className="block text-xs text-muted mb-0.5">Weight</label>
        <input type="number" value={weight} onChange={(e) => onWeightChange(e.target.value)} placeholder="lbs"
          className="w-full bg-card border border-border rounded px-2 py-1.5 text-foreground text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-0.5">Reps</label>
        <input type="number" value={reps} onChange={(e) => onRepsChange(e.target.value)} placeholder="reps"
          className="w-full bg-card border border-border rounded px-2 py-1.5 text-foreground text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-0.5">RPE</label>
        <input type="number" step="0.5" max="10" value={rpe} onChange={(e) => onRpeChange(e.target.value)} placeholder="—"
          className="w-full bg-card border border-border rounded px-2 py-1.5 text-foreground text-sm" />
      </div>
      <div>
        <label className="block text-xs text-muted mb-0.5">RIR</label>
        <input type="number" value={rir} onChange={(e) => onRirChange(e.target.value)} placeholder="—"
          className="w-full bg-card border border-border rounded px-2 py-1.5 text-foreground text-sm" />
      </div>
      <div className="pt-4">
        {onRemove ? (
          <button type="button" onClick={onRemove} aria-label={`Remove set ${setNumber}`}
            className="text-red-400/70 hover:text-red-400 transition text-sm">✕</button>
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>
    </div>
  );
}
