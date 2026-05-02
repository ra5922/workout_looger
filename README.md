# 🏋️ Workout Logger

A full-stack workout tracking app built with **Node.js + Express**, **React (Vite)**, and **Supabase**.

---

## Project Structure

```
workout-logger/
├── backend/                  # Node.js + Express API
│   ├── controllers/
│   │   └── workouts.js       # Workout CRUD + stats logic
│   ├── lib/
│   │   └── supabase.js       # Supabase admin client
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── routes/
│   │   ├── workouts.js       # Workout routes
│   │   └── exercises.js      # Exercise library routes
│   ├── supabase-schema.sql   # ← Run this in Supabase SQL Editor first
│   ├── index.js              # Express entry point
│   └── package.json
│
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── hooks/
    │   │   └── useAuth.jsx    # Auth context (Supabase)
    │   ├── lib/
    │   │   ├── api.js         # Typed API helpers
    │   │   └── supabase.js    # Supabase browser client
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── NewWorkout.jsx
    │   │   └── WorkoutDetail.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `backend/supabase-schema.sql`
3. From **Project Settings → API**, copy:
   - Project URL
   - `anon` public key (for frontend)
   - `service_role` secret key (for backend)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Features

- 🔐 **Auth** — Sign up / sign in via Supabase Auth
- 📋 **Log workouts** — Name, date, notes, and multiple exercises
- 💪 **Exercise library** — 16 built-in exercises across 6 muscle groups
- 📊 **Stats dashboard** — Total volume, sessions, personal records
- 🔒 **Row-level security** — Users only see their own data

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workouts` | List all workouts |
| POST | `/api/workouts` | Create new workout |
| GET | `/api/workouts/:id` | Get workout detail |
| PUT | `/api/workouts/:id` | Update workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| GET | `/api/workouts/stats/summary` | Personal records + stats |
| GET | `/api/exercises` | List exercise library |
| POST | `/api/exercises` | Add custom exercise |

All routes require `Authorization: Bearer <supabase-jwt>` header.
