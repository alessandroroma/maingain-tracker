import { WorkoutLogForm } from "@/components/forms/workout-log-form";

export default function WorkoutPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Log Workout</h1>
      <div className="bg-card p-6 rounded-lg border border-border">
        <WorkoutLogForm />
      </div>
    </main>
  );
}
