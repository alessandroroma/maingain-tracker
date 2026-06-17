# Maingain / Recomp Tracker Project Plan

## 1. Project Overview

### Project Name
**Maingain Tracker**

### Goal
Build an all-in-one self-tracking web app for body recomposition. The app should help track food, bodyweight, waist measurements, workouts, strength progression, and weekly calorie adjustments.

The core goal is to support fat loss while maintaining or gaining strength.

### Primary User
A lifter who wants to:
- Trim down gradually
- Maintain or gain strength
- Track food without using several separate apps
- Log workouts and progression
- Get weekly recommendations based on weight, waist, and strength trends

---

## 2. Core Product Philosophy

This app should not be a complicated bodybuilding platform.

It should answer a few important questions:

1. Am I eating the right amount?
2. Am I hitting enough protein?
3. Is my weight trending down slowly?
4. Is my waist shrinking?
5. Am I maintaining or gaining strength?
6. Should I adjust calories this week?

The app should prioritize:
- Simple daily use
- Fast data entry
- Clear trends
- Practical recommendations
- Minimal clutter

---

## 3. MVP Feature Set

### MVP Version 1

The first version should include only the features needed to make the app useful.

#### Body Tracking
User can enter:
- Date
- Bodyweight
- Waist measurement
- Optional notes

App calculates:
- 7-day average weight
- Weekly weight change
- Waist trend

#### Food Tracking
User can enter:
- Food name
- Calories
- Protein
- Carbs
- Fat
- Meal category
- Date

App calculates:
- Daily calories
- Daily protein
- Daily macros
- Weekly calorie average
- Weekly protein average

#### Workout Tracking
User can enter:
- Workout date
- Workout name
- Exercise
- Sets
- Reps
- Weight
- RPE or RIR
- Notes

App calculates:
- Best set per exercise
- Estimated 1RM
- Total volume
- Previous performance comparison

#### Weekly Check-In
Every week, app summarizes:
- Average bodyweight this week
- Average bodyweight last week
- Weight change
- Waist change
- Calories average
- Protein average
- Strength trend

App recommends:
- Keep calories the same
- Reduce calories slightly
- Increase calories slightly
- Review recovery

---

## 4. Recommended Initial Training Split

### Weekly Structure

```text
Monday: Upper A
Tuesday: Lower A
Wednesday: Rest or walking
Thursday: Upper B
Friday: Lower B
Saturday: Optional light activity
Sunday: Weekly check-in
```

---

### Upper A

| Exercise | Sets | Reps | Notes |
|---|---:|---:|---|
| Chest Press | 3 | 6-10 | Main push |
| Lat Pulldown | 3 | 6-10 | Main pull |
| Shoulder Press | 3 | 6-10 | Main vertical press |
| Chest-Supported Row | 3 | 8-12 | Controlled reps |
| Lateral Raise | 3 | 10-15 | Strict form |
| Curl | 2 | 10-15 | Optional variation |
| Tricep Pushdown | 2 | 10-15 | Optional variation |

---

### Lower A

| Exercise | Sets | Reps | Notes |
|---|---:|---:|---|
| Smith Squat | 3 | 6-10 | Main lower lift |
| Leg Press | 3 | 8-12 | Controlled depth |
| Hamstring Curl | 3 | 8-12 | Full contraction |
| Leg Extension | 3 | 10-15 | Controlled reps |
| Calf Raise | 3 | 10-15 | Pause at stretch |

---

### Upper B

| Exercise | Sets | Reps | Notes |
|---|---:|---:|---|
| Incline Chest Press | 3 | 6-10 | Main push |
| MTS Pulldown | 3 | 6-10 | Main pull |
| Shoulder Press | 3 | 8-12 | Slightly higher reps |
| Cable Row | 3 | 8-12 | Controlled reps |
| Rear Delt Fly | 3 | 12-15 | Strict form |
| Curl | 2 | 10-15 | Optional variation |
| Tricep Extension | 2 | 10-15 | Optional variation |

---

### Lower B

| Exercise | Sets | Reps | Notes |
|---|---:|---:|---|
| Smith Squat | 3 | 8-12 | Slightly lighter than Lower A |
| Walking Lunge | 3 | 10/leg | Substitute split squat if needed |
| Hamstring Curl | 3 | 8-12 | Full control |
| Leg Extension | 3 | 10-15 | Controlled reps |
| Calf Raise | 3 | 10-15 | Pause at stretch |

---

## 5. Progression Logic

### Double Progression
Each exercise has a target rep range.

Example:
- Chest Press: 3 sets of 6-10 reps

Progression rule:
- Use the same weight until all working sets reach the top of the rep range.
- Then increase weight next session.

Example:

```text
Week 1:
90 x 8
90 x 8
90 x 7

Week 2:
90 x 9
90 x 8
90 x 8

Week 3:
90 x 10
90 x 10
90 x 10

Week 4:
Increase to 95
95 x 8
95 x 7
95 x 7
```

### App Recommendation Logic
For each exercise:

```text
IF all sets hit top of rep range:
 suggest increasing weight next session

ELSE IF performance dropped by more than 10%:
 flag possible fatigue or recovery issue

ELSE:
 keep weight the same
```

---

## 6. Nutrition Targets

### Starting Targets

These should be configurable, but initial defaults can be:

```text
Calories: 2600-2800 kcal/day
Protein: 180-200 g/day
Fat: 60-90 g/day
Carbs: remaining calories
```

### Weekly Rate Target

Ideal loss rate:

```text
0.25-0.75 lb per week
```

This is slow enough to preserve strength but fast enough to make visible progress.

---

## 7. Weekly Calorie Adjustment Engine

### Inputs
- 7-day average bodyweight
- Previous 7-day average bodyweight
- Waist measurement trend
- Average daily calories
- Average daily protein
- Strength trend

### Decision Rules

#### Green Light
Condition:
- Weight down 0.25-0.75 lb/week
- Waist stable or down
- Strength stable or up

Recommendation:
```text
Keep calories the same.
```

#### Too Aggressive
Condition:
- Weight down more than 1.0 lb/week
- Strength dropping
- Energy poor

Recommendation:
```text
Increase calories by 100-200 kcal/day.
```

#### Not Moving
Condition:
- Weight flat for 2-3 weeks
- Waist flat
- Calories have been consistent

Recommendation:
```text
Reduce calories by 150-250 kcal/day.
```

#### Ideal Recomp
Condition:
- Scale flat or slightly down
- Waist down
- Strength up

Recommendation:
```text
Keep calories the same. This is working.
```

---

## 8. Data Model

### users

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| email | text | Auth email |
| created_at | timestamp | Account creation |
| height | number | Optional |
| goal_weight | number | Optional |
| target_calories | number | Configurable |
| target_protein | number | Configurable |

---

### body_logs

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| date | date | Log date |
| bodyweight | number | lb |
| waist | number | inches |
| notes | text | Optional |

---

### food_items

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| name | text | Food name |
| calories | number | Per serving |
| protein | number | grams |
| carbs | number | grams |
| fat | number | grams |
| serving_size | text | Optional |

---

### food_logs

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| food_item_id | uuid | Optional |
| date | date | Log date |
| meal_type | text | breakfast/lunch/dinner/snack |
| name | text | Food name |
| calories | number | kcal |
| protein | number | grams |
| carbs | number | grams |
| fat | number | grams |

---

### exercises

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| name | text | Exercise name |
| muscle_group | text | Chest/back/legs/etc. |
| equipment | text | Machine/barbell/dumbbell/cable |
| default_rep_min | number | Lower rep target |
| default_rep_max | number | Upper rep target |

---

### workouts

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| date | date | Workout date |
| name | text | Upper A, Lower A, etc. |
| notes | text | Optional |

---

### workout_sets

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| workout_id | uuid | Foreign key |
| exercise_id | uuid | Foreign key |
| set_number | number | 1, 2, 3, etc. |
| weight | number | lb |
| reps | number | Completed reps |
| rpe | number | Optional |
| rir | number | Optional |
| notes | text | Optional |

---

### program_days

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| name | text | Upper A, Lower A, etc. |
| day_order | number | Sorting |

---

### program_exercises

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| program_day_id | uuid | Foreign key |
| exercise_id | uuid | Foreign key |
| sets | number | Target sets |
| rep_min | number | Lower rep target |
| rep_max | number | Upper rep target |
| notes | text | Optional |

---

### weekly_checkins

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key |
| week_start | date | Start of week |
| avg_weight | number | Calculated |
| weight_change | number | Calculated |
| waist_change | number | Calculated |
| avg_calories | number | Calculated |
| avg_protein | number | Calculated |
| strength_trend | text | up/stable/down |
| recommendation | text | Generated |

---

## 9. Dashboard Requirements

### Main Dashboard
Show:
- Today's calories
- Today's protein
- Weekly average bodyweight
- Weekly weight change
- Latest waist measurement
- Next scheduled workout
- Recent strength PRs
- Current calorie recommendation

### Food Page
Show:
- Daily food log
- Add food form
- Saved foods
- Macro totals
- Weekly averages

### Workout Page
Show:
- Today's assigned workout
- Previous performance for each exercise
- Set entry form
- Suggested next weight
- Notes

### Progress Page
Show charts for:
- Bodyweight
- 7-day average bodyweight
- Waist
- Calories
- Protein
- Estimated 1RM by exercise
- Volume by exercise or muscle group

### Check-In Page
Show:
- Weekly summary
- Trend interpretation
- Calorie recommendation
- Notes field

---

## 10. Suggested Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts

### Backend / Database
- Supabase
- Postgres
- Supabase Auth

### Hosting
- Vercel

### Optional Future Integrations
- Barcode scanning
- Nutrition API
- Apple Health / Google Fit
- CSV import/export
- Progress photo storage
- AI-generated weekly summaries

---

## 11. Development Milestones

### Milestone 1: Project Setup
- Create Next.js app
- Set up TypeScript
- Set up Tailwind
- Connect Supabase
- Set up authentication

### Milestone 2: Database
- Create tables
- Add row-level security
- Create seed exercises
- Create seed program days

### Milestone 3: Body Tracking
- Add body log form
- Add bodyweight table
- Calculate 7-day average
- Add bodyweight chart

### Milestone 4: Food Tracking
- Add food log form
- Add saved foods
- Add daily macro totals
- Add weekly averages

### Milestone 5: Workout Tracking
- Add exercises
- Add workout creation
- Add set logging
- Show previous performance
- Calculate estimated 1RM and volume

### Milestone 6: Dashboard
- Build main dashboard
- Add daily nutrition summary
- Add weekly weight trend
- Add next workout card
- Add recent PR card

### Milestone 7: Weekly Check-In
- Calculate weekly averages
- Generate recommendation
- Store weekly check-ins
- Show check-in history

### Milestone 8: Polish
- Improve mobile layout
- Add edit/delete actions
- Add loading states
- Add validation
- Add export feature

---

## 12. OpenClaw Build Prompt

Use this prompt to start the build:

```text
Build a personal maingain/recomp tracking web app.

The app should help a user track food intake, bodyweight, waist measurements, workouts, strength progression, and weekly calorie recommendations.

Use:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Postgres
- Recharts

Core features:
1. User authentication
2. Daily bodyweight and waist logging
3. Food logging with calories, protein, carbs, and fat
4. Saved foods
5. Workout logging by exercise, sets, reps, weight, and RPE/RIR
6. Program builder with Upper A, Lower A, Upper B, Lower B
7. Progress charts
8. Weekly check-in page that recommends calorie adjustments

The MVP should prioritize simple mobile-friendly data entry, clear dashboards, and trend calculations.

Use the project plan below as the product spec.
```

---

## 13. Future Feature Ideas

### Nutrition
- Barcode scanner
- Food database API
- Recipe builder
- Saved meals
- Macro templates
- Meal prep planner

### Training
- Auto-progression suggestions
- Deload recommendations
- Exercise substitutions
- Muscle group volume tracking
- Rest timer
- Plate calculator

### Body Progress
- Progress photos
- Neck/chest/arm/thigh measurements
- Body fat estimate
- Goal timeline projection

### Analytics
- Strength-to-bodyweight ratio
- Calories versus weight trend
- Protein adherence score
- Recovery score
- Weekly consistency score

---

## 14. Definition of Done for MVP

The MVP is complete when the user can:

- Log daily bodyweight
- Log waist measurements
- Log foods and see daily calories/protein
- Log workouts with sets/reps/weight
- View previous workout numbers
- View bodyweight trend
- View calorie/protein weekly averages
- Complete a weekly check-in
- Receive a simple calorie adjustment recommendation

The MVP does not need:
- Barcode scanning
- Full food database
- Social features
- Advanced AI coaching
- Native mobile app
- Perfect analytics

---

## 15. Key Success Metric

The app is successful if it helps the user consistently answer:

```text
Is my waist going down while my strength stays the same or improves?
```

That is the main signal that the maingain/recomp plan is working.
