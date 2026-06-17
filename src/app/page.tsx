export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Maingain Tracker</h1>
        <p className="text-muted mt-2">Track food, workouts, and body recomposition</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Today&apos;s Calories</h2>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Today&apos;s Protein</h2>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-sm font-medium text-muted mb-2">Weekly Weight Change</h2>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition">
            Log Bodyweight
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition">
            Log Food
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition">
            Log Workout
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded transition">
            Weekly Check-In
          </button>
        </div>
      </div>
    </main>
  );
}
