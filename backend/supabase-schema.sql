-- =============================================
-- WORKOUT LOGGER — Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ---- EXERCISES (shared library) ----
create table exercises (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  muscle_group text not null,         -- e.g. Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Full Body
  description text,
  created_by  uuid references auth.users(id), -- null = built-in exercise
  created_at  timestamptz default now()
);

-- Seed built-in exercises
insert into exercises (name, muscle_group) values
  ('Bench Press', 'Chest'),
  ('Incline Dumbbell Press', 'Chest'),
  ('Push Up', 'Chest'),
  ('Cable Fly', 'Chest'),
  ('Chest Dip', 'Chest'),
  ('Pull Up', 'Back'),
  ('Barbell Row', 'Back'),
  ('Lat Pulldown', 'Back'),
  ('Deadlift', 'Back'),
  ('Seated Cable Row', 'Back'),
  ('Face Pull', 'Back'),
  ('Overhead Press', 'Shoulders'),
  ('Lateral Raise', 'Shoulders'),
  ('Front Raise', 'Shoulders'),
  ('Rear Delt Fly', 'Shoulders'),
  ('Barbell Squat', 'Legs'),
  ('Romanian Deadlift', 'Legs'),
  ('Leg Press', 'Legs'),
  ('Lunges', 'Legs'),
  ('Leg Curl', 'Legs'),
  ('Leg Extension', 'Legs'),
  ('Calf Raise', 'Legs'),
  ('Bicep Curl', 'Arms'),
  ('Hammer Curl', 'Arms'),
  ('Tricep Pushdown', 'Arms'),
  ('Skull Crusher', 'Arms'),
  ('Tricep Dip', 'Arms'),
  ('Plank', 'Core'),
  ('Crunch', 'Core'),
  ('Russian Twist', 'Core'),
  ('Hanging Leg Raise', 'Core'),
  ('Ab Wheel Rollout', 'Core'),
  ('Treadmill', 'Cardio'),
  ('Cycling', 'Cardio'),
  ('Jump Rope', 'Cardio'),
  ('Rowing Machine', 'Cardio'),
  ('Stair Climber', 'Cardio'),
  ('Elliptical', 'Cardio'),
  ('Battle Ropes', 'Cardio'),
  ('Burpees', 'Full Body'),
  ('Kettlebell Swing', 'Full Body'),
  ('Clean and Press', 'Full Body'),
  ('Farmer''s Walk', 'Full Body');

-- ---- WORKOUTS ----
create table workouts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  date       date not null default current_date,
  notes      text,
  created_at timestamptz default now()
);

-- ---- WORKOUT EXERCISES (join table) ----
create table workout_exercises (
  id          uuid primary key default uuid_generate_v4(),
  workout_id  uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  sets        int not null default 3,
  reps        int not null default 10,
  weight_kg   numeric(6,2) default 0,
  notes       text,
  "order"     int default 0,
  created_at  timestamptz default now()
);

-- ---- ROW LEVEL SECURITY ----
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table exercises enable row level security;

-- Workouts: users can only see/edit their own
create policy "Users manage own workouts"
  on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Workout exercises: accessible through workout ownership
create policy "Users manage own workout exercises"
  on workout_exercises for all
  using (
    exists (
      select 1 from workouts
      where workouts.id = workout_exercises.workout_id
        and workouts.user_id = auth.uid()
    )
  );

-- Exercises: anyone can read, only owner can edit custom ones
create policy "Anyone can read exercises"
  on exercises for select
  using (true);

create policy "Users can insert custom exercises"
  on exercises for insert
  with check (auth.uid() = created_by);
