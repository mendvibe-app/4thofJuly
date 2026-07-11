# Harbor Way 4th of July Soccer Tennis

Tournament day app for the Harbor Way invitational: registration, pool play, knockout, and live scoring.

## Stack

- **Next.js 15** (App Router) + TypeScript + React 19
- **Supabase** (Postgres + Realtime) via browser anon key
- **Tailwind CSS** + Radix UI
- **Vitest** for domain logic tests
- **Vercel** for hosting

## Architecture (post-cleanup)

| Concern | Where |
|---|---|
| Shared data / realtime | `hooks/use-tournament-data.tsx` (`TournamentDataProvider`) |
| Registration validation | `lib/registration.ts` |
| Pool schedule + standings | `lib/pool-play/` |
| Knockout seeding / byes | `lib/knockout/` |
| Live match helpers | `lib/live/` |
| Primary tournament pick | `lib/tournaments/` |
| Scoring constants (11 win-by-2) | `lib/scoring.ts` |
| Admin session | `hooks/use-admin.tsx` + `ADMIN_SYSTEM.md` |

**Single-active tournament:** the live UI, scores, pending queue, and public signup are scoped to one primary tournament (`status=active`, else latest date). Switch it from Admin → Tournament Management → **Make Active**.

**Trust model:** client-only Supabase with open RLS by design. Real write protection is the admin passcode + `requireAdmin()` UI gates. See `ADMIN_SYSTEM.md`.

## Routes

| Path | Purpose |
|---|---|
| `/` | Main tournament UI (phase-driven) |
| `/register` | Public team signup (queued for approval) |
| `/admin` | Admin login + tournament / registration management |
| `/standings` | Standings view |
| `/rules` | Tournament rules |

## Phases

1. **Registration** — approve teams, track paid
2. **Pool play** — round robin, live scores, standings
3. **Knockout** — seeded bracket with byes as needed

## Local development

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# optional locally: NEXT_PUBLIC_ADMIN_PASSCODE

npm install --legacy-peer-deps
npm run dev
```

Tests: `npm test` · Production build: `npm run build`

Database: run `scripts/create-tables.sql` (and realtime scripts if needed) in the Supabase SQL editor. Details in `SETUP_GUIDE.md`.

## Docs map

- `SETUP_GUIDE.md` — local env + DB
- `DEPLOYMENT_GUIDE.md` — Vercel + production checklist
- `ADMIN_SYSTEM.md` — passcode, gates, trust model, single-active
- `REALTIME_SETUP.md` — realtime publication + polling fallback

## Cleanup history

Stacked hardening PRs: foundation/data → admin/security → registration → pool → knockout → live UX → multi-tournament → docs/polish.
