# 🏔️ Ascend — Gamified Study & Workout Tracker

> **"Rise one step at a time."**
> A clean, minimal gamified tracker that helps you build consistency in studying
> and working out through daily tasks, long-term plans, and visual progress.
> Built as an SIH prototype — calm, human, and functional. No neon, no gimmicks.

---

## ⚡ Quick start

```bash
# Terminal 1 — backend
cd server
npm install
npm start                  # → http://localhost:4000

# Terminal 2 — frontend
cd client
npm install
npm run dev                # → http://localhost:5173
```

Open **http://localhost:5173** and log in:

| Demo account |                |
| ------------ | -------------- |
| Email        | `rahul@ascend.app` |
| Password     | `demo1234`     |

The demo account ships with ~70 days of realistic history, a live streak, two
active plans, and today's tasks **half done** — so every feature (heatmap,
streaks, EXP bonuses, level bar) is immediately visible. There's also a
**"Try the demo account"** button right on the login page.

> The very first boot auto-seeds this demo data (JSON mode only). To start
> fresh: delete `server/data/ascend-data.json` and restart.

---

## 🧰 Tech stack

| Layer    | Technology                  |
| -------- | --------------------------- |
| Frontend | React 18 (Vite) + Tailwind CSS |
| Backend  | Node.js + Express           |
| Database | MongoDB (Mongoose) **or** zero-setup JSON store |
| Auth     | JWT (email + bcrypt-hashed password) |
| Icons    | Lucide React                |

### Two data modes (why?)

- **MongoDB mode** — set `MONGODB_URI` in `server/.env` (local or Atlas). The
  Mongoose schemas live in `server/models/` exactly as specified.
- **Demo mode (default)** — leave `MONGODB_URI` empty and the server uses a
  tiny file-backed store at `server/data/ascend-data.json`. Perfect for a
  hackathon demo: zero setup, and you can open the JSON file to show the data
  model. Both modes expose the **same API** through one small data layer
  (`server/services/dataStore.js`), so controllers never know the difference.

---

## ✨ Features

### 🏠 Home (`/home`)
- Today's tasks grouped by category (Study / Workout / Personal / Other) with
  collapsible sections
- Tick a task → checkbox fill, strikethrough, floating **+20 EXP**, and the
  level bar slides forward. Calm feedback, no confetti.
- Level chip (`Level 8 · Builder`) + EXP bar with "X / Y EXP to Level N+1"
- Quick stats: tasks done today + current 🔥 streak
- Inline Add-Task form (title, category, EXP — pre-filled, editable), inline
  edit/delete per task
- Tasks generated from plans appear here automatically on the right dates

### 🎯 Plans (`/plans`)
- Two-step creation flow: **1. Basic info** (title, goal, dates, description) →
  **2. Recurring tasks** (Daily / Specific Days / Weekly, EXP reward, per-task
  end date)
- Tasks are auto-generated daily on Home for a rolling 90-day window
- **Edit with confidence**: changes apply to *future tasks only* by default
  (optional: all incomplete tasks). Completed tasks are **never** deleted.
- Pause (stops generating + clears upcoming), Resume (regenerates), Mark
  Complete, Delete (keeps completed history)
- Progress bar per plan (completed / total generated tasks) and an expandable
  "View Tasks" preview of the next 14 days

### 📅 Calendar (`/calendar`)
- **Month view**: colored dots per day (grey / light / medium / dark green),
  🔥 on 5+-done days, month navigation
- **Heatmap view**: LeetCode-style 365-day grid with month labels, weekday
  labels, 🔥 markers, and a legend
- Hover any day → popup with exactly what was done, what wasn't, and EXP earned
- Click any day → full detail panel below

### 👤 Profile (`/profile`)
- Auto-generated initials avatar, level + title
- Stats: Total EXP, level progress, current & longest streak, total tasks
  completed, active plans
- Edit profile (name / email / password) and logout

---

## 🧮 The EXP system (fully transparent)

| Action                              | EXP        |
| ----------------------------------- | ---------- |
| Complete a task                     | +20 (configurable per task) |
| Complete **all** tasks in a day     | +30 bonus  |
| Streak reaches a multiple of 7 days | +50 bonus  |
| Streak reaches a multiple of 30 days| +200 bonus |

**Levels:** `EXP for next level = floor(100 × 1.5^(level−1))`
→ 100, 150, 225, 337, 506, …

**Titles:** 1–5 Seedling · 6–10 Builder · 11–20 Climber · 21–35 Achiever ·
36–50 Ascendant · 50+ Legend

Everything is earned/revoked honestly — unticking a task removes its EXP and
any now-invalid day bonus (one-time bonuses can never be farmed).

---

## 🔌 API reference

Base URL: `/api` — all routes (except auth) require `Authorization: Bearer <token>`.

| Method & path             | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `POST /auth/register`     | Create account → `{ token, user }`             |
| `POST /auth/login`        | Log in → `{ token, user }`                     |
| `GET  /auth/me`           | Current user                                   |
| `PUT  /auth/me`           | Update name / email / password                 |
| `GET  /tasks?date=`       | Tasks for a day (also `?from=&to=&planId=`)    |
| `POST /tasks`             | Create a task                                  |
| `PUT  /tasks/:id`         | Edit a task                                    |
| `DELETE /tasks/:id`       | Delete a task                                  |
| `PATCH /tasks/:id/complete` | Toggle done → awards/revokes EXP & bonuses   |
| `GET  /plans`             | All plans + progress stats                     |
| `POST /plans`             | Create plan **and generate its tasks**         |
| `GET  /plans/:id`         | One plan                                       |
| `PUT  /plans/:id`         | Edit plan (`applyTo: future\|all`) **or** `{ action: pause\|resume\|complete }` |
| `DELETE /plans/:id`       | Delete plan (keeps completed history)          |
| `POST /plans/:id/generate`| Top up the rolling task window                 |
| `GET  /stats/heatmap`     | 365 days of per-day summaries                  |
| `GET  /stats/summary`     | Level, EXP, streaks, totals                    |
| `GET  /stats/day/:date`   | Full detail for one day                        |

---

## 📁 Project structure

```
ascend/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── components/            # Navbar, TaskCard, TaskForm, LevelBadge,
│       │                          # HeatmapCalendar, PlanCard, DayDetailPopup,
│       │                          # ProfileDropdown
│       ├── pages/                 # Home, Plan, Calendar, Profile, Login, Signup
│       ├── hooks/                 # useTasks (data), useLevel (EXP display)
│       ├── context/               # AuthContext
│       └── utils/                 # api, expCalculator, dateHelpers, constants
└── server/                        # Express backend
    ├── models/                    # User, Task, Plan (Mongoose schemas)
    ├── routes/                    # auth, tasks, plans, stats
    ├── controllers/               # request handling
    ├── middleware/                # JWT auth
    ├── services/                  # dataStore (+ json/mongo backends),
    │                              # expService, taskGenerator
    ├── config/db.js               # MongoDB connection
    ├── seed.js                    # demo data (auto-runs on first boot)
    └── server.js                  # entry point
```

---

## 🎬 5-minute SIH demo script

1. **Login page** → click **"Try the demo account"**.
2. **Home**: point out the level bar and the 2 pending tasks. Tick one →
   floating **+EXP**, bar moves. Tick the last one → **"All tasks done for the
   day (+30 EXP)"** notice appears.
3. **Calendar** → switch to **Heatmap View**: months of green with 🔥 days.
   Hover a day for the detail popup; click for the full day panel.
4. **Plans**: open "View Tasks" on *GATE 2027 Preparation* to show the
   auto-generated daily tasks. Edit the plan → change a frequency →
   "Apply to future tasks only".
5. **Create a plan live**: "JEE Physics Revision", 1 daily task, 1 weekly task
   → Home instantly shows today's new tasks.
6. **Profile**: stats cards, level title, edit profile.

---

## ⚙️ Configuration (`server/.env`)

| Variable      | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `PORT`        | Backend port (default `4000`)                    |
| `JWT_SECRET`  | Token-signing secret (change in production!)     |
| `MONGODB_URI` | Set to use MongoDB; leave empty for demo mode    |

The frontend dev server proxies `/api/*` to the backend (see
`client/vite.config.js`), so no CORS setup is needed in development. For
production, run `npm run build` in `client/` — the Express server
automatically serves the built app from `client/dist`.

---

## 📝 Prototype simplifications (intentional)

- **Milestones** from the original mock are represented by per-plan task
  progress (a milestone tracker is a natural v2 addition).
- The heatmap covers the past 365 days; future scheduled tasks appear in month
  view but not in the heatmap.
- No social features, no AI — by design. Dark mode and a fully responsive
  layout are built in. 🙂

*Built for SIH Internal Prototype — keep it simple, ship it clean.* 🏔️
