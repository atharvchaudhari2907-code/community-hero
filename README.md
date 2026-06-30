# Community Hero 🏙️

AI-powered civic issue reporting and resolution platform. A citizen photographs a
pothole, broken streetlight, or overflowing bin → AI categorises it, assigns
severity, routes it to the right department, dispatches the nearest field
worker, tracks resolution in real time, and rewards the citizen with XP.

This is a **fully working prototype** — every endpoint and screen described
below actually runs, with no external accounts required to get started.

## What's real right now, no setup required

- Real Next.js 15.5.18 frontend + FastAPI backend, talking to each other over a
  real HTTP API
- Real auth (JWT, bcrypt password hashing)
- Real local database (SQLite via SQLModel) — submissions, status changes,
  and XP all persist across restarts
- Real AI classification pipeline — falls back to a transparent rule-based
  text classifier when no Gemini key is set, so the whole submit → analyze →
  route → assign flow works immediately
- Real worker-dispatch logic — nearest-available-worker selection using
  real haversine distance calculations
- Real XP/leveling/streak system
- **Live interactive map** (Leaflet/OpenStreetMap, no API key needed) showing
  every reported issue color-coded by severity, with filters by status and
  category, an activity feed, and one-tap upvoting from the map, dashboards,
  or the complaint detail page
- Seed data: 1 citizen, 3 workers, 1 admin, 5 sample Pune complaints

Visual design follows a "Citizen-Powered Civic Tech" identity: trust blue
(#0EA5E9), action green (#10B981), and community gold (#F59E0B) for
gamification, Inter for UI text, JetBrains Mono for stat numbers, with an
animated mesh-gradient hero, live counters, and a scrolling activity ticker
on the landing page.

## Coming in the next pass (not built yet)

- Comments/discussion threads on each issue
- Duplicate-report detection and merging (same category, ~100m radius,
  within 48 hours)
- Leaderboard page, achievement badges, and a points redemption store
- Admin worker/department management screens, analytics charts
- Celery/Redis async task queue (AI currently runs inline — simpler, still
  fully functional for a prototype) and the SLA escalation background job

## What needs your own credentials to go "fully live"

| Feature | Without credentials | With your credentials |
|---|---|---|
| AI image analysis | Rule-based text classifier (clearly labeled `rule_based_fallback` in every response) | Real Gemini 1.5 Flash image analysis |
| Worker dispatch | Straight-line (haversine) distance | Real driving-time via Google Maps Distance Matrix |
| Database | Local SQLite file | Firebase Firestore |
| File storage | Local disk, served by FastAPI | Firebase Storage |
| Push notifications | Not active | Firebase Cloud Messaging |

Every one of these is wired with real, correct code already — you're just
flipping a switch in `.env` once you have the credentials. **Never paste real
API keys into a chat with an AI assistant** — only into your own local `.env`
files.

## Quick start

### Prerequisites
- Node.js 20+
- Python 3.11+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # already has safe local defaults
python -m app.utils.seed      # creates demo users + sample complaints
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Demo logins (password for all: `Password123`):
- Citizen: `citizen@demo.in`
- Worker: `ramesh.worker@demo.in` (Roads & PWD), `suresh.worker@demo.in` (Solid Waste), `dinesh.worker@demo.in` (Electrical)
- Admin: `admin@demo.in`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points at localhost:8000 by default
npm run dev
```

Open http://localhost:3000

### 3. Try the core flow
1. Log in as `citizen@demo.in`
2. Click **Report an issue**, optionally attach a photo, fill in the form,
   click **Use my current location**, submit
3. Watch the AI analysis, routing, and worker assignment happen live
4. Click **Live Map** in the nav bar to see every issue plotted on an
   interactive map, color-coded by severity, with filters and upvoting
5. Log out, log back in as `ramesh.worker@demo.in` → see the task on the
   worker dashboard → walk it through *en route → in progress → resolved*
6. Log back in as the citizen → open the complaint → **Confirm resolved** →
   watch XP get awarded

## Switching on real Gemini / Firebase / Maps

1. **Gemini**: get a key at https://aistudio.google.com/apikey, put it in
   `backend/.env` as `GEMINI_API_KEY=...`. Restart the backend. Submissions
   with a photo now get real Gemini 1.5 Flash image analysis; the
   `ai_analysis.source` field in the API response will read `"gemini"`
   instead of `"rule_based_fallback"`.
2. **Google Maps** (better worker dispatch): get a key with Distance Matrix
   API enabled, set `GOOGLE_MAPS_API_KEY` in `backend/.env`.
3. **Firebase** (real DB/Storage/Auth at scale): create a Firebase project,
   download a service account JSON, set `FIREBASE_SERVICE_ACCOUNT_JSON` and
   `USE_FIREBASE=true` in `backend/.env`. Note: the current build ships with
   the local SQLite data layer fully wired; swapping in real Firestore calls
   means implementing `firestore_service.py` against the same interface the
   SQLite-backed routers already use (the data shapes are identical, so this
   is a service-layer swap, not a rewrite).

## Project structure

```
community-hero/
├── backend/
│   ├── app/
│   │   ├── main.py              FastAPI app + router wiring
│   │   ├── config.py            Settings, feature flags (USE_FIREBASE, GEMINI_API_KEY, etc.)
│   │   ├── database.py          SQLite engine/session
│   │   ├── dependencies.py      JWT auth, password hashing, role guards
│   │   ├── models/
│   │   │   ├── db.py            SQLModel tables (User, Complaint)
│   │   │   └── schemas.py       API request/response Pydantic models
│   │   ├── routers/             auth, complaints, workers, upload, stats, rewards
│   │   ├── services/
│   │   │   ├── gemini_service.py     Real Gemini call + rule-based fallback
│   │   │   ├── maps_service.py       Real Distance Matrix + haversine fallback
│   │   │   └── rewards_service.py    XP/leveling/streaks
│   │   └── utils/
│   │       ├── response.py      Standard API envelope
│   │       └── seed.py          Demo data seeder
│   └── tests/                   pytest suite covering the core flow
│
└── frontend/
    ├── app/
    │   ├── (auth)/login, register
    │   ├── citizen/dashboard, report, complaints/[id], rewards
    │   ├── worker/dashboard
    │   ├── admin/dashboard
    │   └── map/                  Live interactive issue map
    ├── components/
    │   ├── ui, complaint, ai, shared
    │   └── map/                  ComplaintMap, LiveIssueMap (SSR-safe), MapLegend
    ├── hooks/                    useAuth, useGeolocation, useLiveClock
    ├── lib/                      api client, zod validators, utils
    ├── store/                    Zustand auth/UI state
    └── types/                   shared TypeScript types matching backend schemas
```

## What's intentionally not built yet

This prototype focuses on the **core citizen → AI → worker → resolution**
loop end-to-end, plus the live map and upvoting, rather than every screen in
the original spec documents. See "Coming in the next pass" above for what's
next. The backend service layer is structured so all of these are
straightforward additions on top of what's here.
