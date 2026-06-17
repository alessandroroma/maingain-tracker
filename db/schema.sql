-- Maingain Tracker Database Schema

-- Create extensions
create extension if not exists "uuid-ossp";

-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamp with time zone default now(),
  height numeric,
  goal_weight numeric,
  target_calories numeric default 2700,
  target_protein numeric default 190
);

-- Body logs (weight + waist)
create table body_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  bodyweight numeric not null,
  waist numeric,
  notes text,
  unique(user_id, date)
);

-- Saved food items
create table food_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  calories numeric not null,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  serving_size text
);

-- Food logs (daily entries)
create table food_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  food_item_id uuid references food_items(id),
  date date not null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  name text not null,
  calories numeric not null,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0
);

-- Exercises
create table exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  muscle_group text,
  equipment text,
  default_rep_min int default 6,
  default_rep_max int default 10
);

-- Workouts
create table workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  name text not null,
  notes text
);

-- Workout sets
create table workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid references workouts(id) on delete cascade,
  exercise_id uuid references exercises(id),
  set_number int not null,
  weight numeric not null,
  reps int not null,
  rpe numeric,
  rir numeric,
  notes text
);

-- Program days (Upper A, Lower A, etc.)
create table program_days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  day_order int not null
);

-- Program exercises (exercises within a program day)
create table program_exercises (
  id uuid primary key default uuid_generate_v4(),
  program_day_id uuid references program_days(id) on delete cascade,
  exercise_id uuid references exercises(id),
  sets int not null,
  rep_min int not null,
  rep_max int not null,
  notes text
);

-- Weekly check-ins
create table weekly_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  week_start date not null,
  avg_weight numeric,
  weight_change numeric,
  waist_change numeric,
  avg_calories numeric,
  avg_protein numeric,
  strength_trend text check (strength_trend in ('up','stable','down')),
  recommendation text
);

-- Row-level security policies
alter table users enable row level security;
alter table body_logs enable row level security;
alter table food_items enable row level security;
alter table food_logs enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table program_days enable row level security;
alter table program_exercises enable row level security;
alter table weekly_checkins enable row level security;

-- Policy: users can only access their own data
create policy "Users can view own data" on users for select using (auth.uid() = id);
create policy "Users can update own data" on users for update using (auth.uid() = id);

create policy "Users can view own body logs" on body_logs for select using (auth.uid() = user_id);
create policy "Users can insert own body logs" on body_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own body logs" on body_logs for update using (auth.uid() = user_id);
create policy "Users can delete own body logs" on body_logs for delete using (auth.uid() = user_id);

create policy "Users can view own food items" on food_items for select using (auth.uid() = user_id);
create policy "Users can insert own food items" on food_items for insert with check (auth.uid() = user_id);
create policy "Users can update own food items" on food_items for update using (auth.uid() = user_id);
create policy "Users can delete own food items" on food_items for delete using (auth.uid() = user_id);

create policy "Users can view own food logs" on food_logs for select using (auth.uid() = user_id);
create policy "Users can insert own food logs" on food_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own food logs" on food_logs for update using (auth.uid() = user_id);
create policy "Users can delete own food logs" on food_logs for delete using (auth.uid() = user_id);

create policy "Users can view own exercises" on exercises for select using (auth.uid() = user_id);
create policy "Users can insert own exercises" on exercises for insert with check (auth.uid() = user_id);

create policy "Users can view own workouts" on workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on workouts for insert with check (auth.uid() = user_id);

create policy "Users can view own workout sets" on workout_sets for select using (auth.uid() = user_id);
create policy "Users can insert own workout sets" on workout_sets for insert with check (auth.uid() = user_id);

create policy "Users can view own program days" on program_days for select using (auth.uid() = user_id);
create policy "Users can insert own program days" on program_days for insert with check (auth.uid() = user_id);

create policy "Users can view own program exercises" on program_exercises for select using (auth.uid() = user_id);
create policy "Users can insert own program exercises" on program_exercises for insert with check (auth.uid() = user_id);

create policy "Users can view own check-ins" on weekly_checkins for select using (auth.uid() = user_id);
create policy "Users can insert own check-ins" on weekly_checkins for insert with check (auth.uid() = user_id);

-- Seed: default exercises
insert into exercises (name, muscle_group, equipment, default_rep_min, default_rep_max) values
  ('Chest Press', 'chest', 'machine', 6, 10),
  ('Lat Pulldown', 'back', 'machine', 6, 10),
  ('Shoulder Press', 'shoulders', 'machine', 6, 10),
  ('Chest-Supported Row', 'back', 'machine', 8, 12),
  ('Lateral Raise', 'shoulders', 'dumbbell', 10, 15),
  ('Curl', 'biceps', 'dumbbell', 10, 15),
  ('Tricep Pushdown', 'triceps', 'cable', 10, 15),
  ('Smith Squat', 'legs', 'machine', 6, 10),
  ('Leg Press', 'legs', 'machine', 8, 12),
  ('Hamstring Curl', 'hamstrings', 'machine', 8, 12),
  ('Leg Extension', 'quads', 'machine', 10, 15),
  ('Calf Raise', 'calves', 'machine', 10, 15),
  ('Incline Chest Press', 'chest', 'machine', 6, 10),
  ('MTS Pulldown', 'back', 'machine', 6, 10),
  ('Cable Row', 'back', 'cable', 8, 12),
  ('Rear Delt Fly', 'rear delts', 'machine', 12, 15),
  ('Tricep Extension', 'triceps', 'cable', 10, 15),
  ('Walking Lunge', 'legs', 'bodyweight', 10, 10);
