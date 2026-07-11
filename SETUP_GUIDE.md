# Tournament App Setup Guide

## Prerequisites

- Node.js 20+
- A Supabase project
- Optional: Vercel account for deploy

## 1. Environment

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_PASSCODE=...   # optional locally; required in production
```

Values: Supabase Dashboard → Project Settings → API.

## 2. Database

In Supabase → SQL Editor, run:

1. `scripts/create-tables.sql` — tables, RLS (public read/write by design), default active tournament
2. `scripts/enable-realtime.sql` — add tables to `supabase_realtime` (or the alternative script)

Tables used by the app:

| Table | Role |
|---|---|
| `tournaments` | Phase, bye, status (primary source of truth) |
| `teams` | Roster + paid + pool stats |
| `matches` | Pool + knockout scores |
| `pending_team_registrations` | Public signup queue |

`tournament_settings` may still exist for legacy installs; the app reads phase/bye from `tournaments` only.

## 3. Install & run

```bash
npm install --legacy-peer-deps
npm run dev
```

- App: http://localhost:3000
- Admin: http://localhost:3000/admin
- Register: http://localhost:3000/register

Connection badge in the UI: **LIVE** (realtime), **POLLING** (30s fallback), or **OFFLINE**.

## 4. Smoke test

1. Log in at `/admin` with the passcode
2. Confirm one tournament is **Active** (Make Active if needed)
3. Approve a pending registration or add a team from the main app
4. Advance phase (admin only) → generate pool matches → enter scores
5. Open a second browser (logged out) and confirm spectators cannot edit scores or change phase

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| Blank / connection error | Check `.env.local` and that the Supabase project is not paused |
| Table does not exist | Re-run `scripts/create-tables.sql` |
| Admin login disabled | Set `NEXT_PUBLIC_ADMIN_PASSCODE` (required in production) |
| Scores not syncing | See `REALTIME_SETUP.md`; polling still updates every 30s |
| Wrong teams/matches | Confirm the intended tournament is Active |

More on admin trust model: `ADMIN_SYSTEM.md`.
