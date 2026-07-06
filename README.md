# Maingain Tracker

All-in-one body recomposition tracker.

Track food intake, bodyweight, waist measurements, workouts, strength progression, and weekly calorie adjustments — all in one place.

**Goal:** Trim down gradually while maintaining or gaining strength.

## Core Questions

1. Am I eating the right amount?
2. Am I hitting enough protein?
3. Is my weight trending down slowly?
4. Is my waist shrinking?
5. Am I maintaining or gaining strength?
6. Should I adjust calories this week?

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run dev server
npm run dev
# → http://localhost:3000
```

## Supabase Setup

This app uses Supabase for the database. Here's how to set it up:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose the same region as your Vercel deployment (for lowest latency)
3. Wait for the project to initialize (~2 minutes)

### 2. Run the Database Schema

Go to the SQL Editor in your Supabase dashboard and run `db/schema.sql`:

```
Supabase Dashboard → SQL Editor → New query → Paste schema.sql → Run
```

This creates all tables, RLS policies, and seed data (exercises, program days).

### 3. Get Your Environment Variables

Go to **Settings → API** in your Supabase dashboard and copy:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Optional: the food page's database search uses Open Food Facts (no key needed) plus USDA FoodData Central. USDA works out of the box on the shared `DEMO_KEY`, but a personal key (free, instant, from [api.data.gov/signup](https://api.data.gov/signup/)) avoids shared rate limits:

```env
USDA_API_KEY=your-usda-key
```

### 4. (Optional) Set Up Auth

The current schema doesn't enforce auth — all data is stored without user_id fields for simplicity. If you add auth later:

1. Enable Email Auth in Supabase Authentication → Providers
2. Add RLS policies that filter by `auth.uid()`
3. Add a `users` table with `id` matching `auth.users.id`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add the Supabase environment variables in Vercel project settings
4. Deploy

### Self-Hosted

```bash
npm run build
npm start
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your hosting environment.

## Features

### Body Tracking
- Daily bodyweight and waist logging
- Weight trend chart (last 30 days)
- Weekly weight change calculation

### Food Tracking
- Log meals by type (breakfast/lunch/dinner/snack)
- Track calories, protein, carbs, and fat
- Save custom foods for quick logging
- Daily and weekly macro averages

### Workout Tracking
- Log sets with weight, reps, RPE, and RIR
- Automatic exercise creation
- Previous performance comparison
- Volume and 1RM calculations

### Dashboard
- Today's calories and protein
- Latest bodyweight and weekly change
- Weight trend chart
- Quick stats overview

### Weekly Check-In
- Auto-calculate averages from logged data
- Smart calorie recommendation engine
- Track strength trends
- Save check-in history

### Progress
- Bodyweight trend chart
- Macro donut chart with targets
- Volume by exercise

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (recommended)

## Project Structure

```
src/
├── app/
│   ├── api/          # Supabase API routes
│   │   ├── body-logs/route.ts
│   │   ├── food-logs/route.ts
│   │   └── workouts/route.ts
│   ├── dashboard/    # Main dashboard
│   ├── food/         # Food logging
│   ├── foods/        # Saved foods management
│   ├── workout/      # Workout logging
│   ├── checkin/      # Weekly check-in
│   ├── checkin-history/ # Check-in history
│   ├── progress/     # Progress charts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── charts/       # Weight, volume, macro charts
│   ├── forms/        # Body, food, workout log forms
│   └── navigation.tsx
└── lib/
    └── supabase.ts   # Supabase client
```

## License

Private — built for personal use.
