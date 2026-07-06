export const metadata = {
  title: "Privacy Policy — Maingain Tracker",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: July 7, 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <p>
          Maingain Tracker is a personal, single-user fitness application operated by its
          owner for their own use. It is not a commercial service and has no other users.
        </p>

        <h2 className="font-semibold text-base pt-2">Data collected</h2>
        <p>
          The app stores data entered by its owner (food logs, bodyweight, waist
          measurements, workouts, and weekly check-ins) and, with authorization, recovery
          metrics retrieved from connected services such as Oura and WHOOP (daily
          readiness/recovery scores, sleep duration and scores, heart-rate variability,
          and resting heart rate).
        </p>

        <h2 className="font-semibold text-base pt-2">How data is used</h2>
        <p>
          All data is used solely to display trends and generate training and nutrition
          recommendations to the owner within this app. Data is stored in a private
          database (Supabase/PostgreSQL) controlled by the owner.
        </p>

        <h2 className="font-semibold text-base pt-2">What we don&apos;t do</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>No data is sold, rented, or shared with third parties.</li>
          <li>No advertising, tracking pixels, or third-party analytics.</li>
          <li>No data is used for any purpose other than the owner&apos;s own fitness tracking.</li>
        </ul>

        <h2 className="font-semibold text-base pt-2">Third-party services</h2>
        <p>
          Food searches are sent to Open Food Facts and USDA FoodData Central and contain
          only the search terms. Connected wearable services (Oura, WHOOP) are accessed
          read-only through their official APIs using credentials authorized by the owner.
        </p>

        <h2 className="font-semibold text-base pt-2">Revoking access &amp; deletion</h2>
        <p>
          Wearable connections can be revoked at any time from the respective service&apos;s
          account settings (WHOOP: App Settings; Oura: Personal Access Tokens). Since the
          owner controls the database, any stored data can be deleted at any time.
        </p>

        <h2 className="font-semibold text-base pt-2">Contact</h2>
        <p>
          Questions about this policy: alex.roma00@gmail.com
        </p>
      </section>
    </main>
  );
}
