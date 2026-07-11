# Deployment Guide

## Vercel (recommended)

1. Import `mendvibe-app/4thofJuly` in [Vercel](https://vercel.com)
2. Set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ADMIN_PASSCODE=...   # required — login is disabled without it
```

3. Deploy. Pushes to `main` redeploy automatically; PRs get preview URLs.

CLI alternative:

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Production checklist

- [ ] Env vars set (including admin passcode)
- [ ] `scripts/create-tables.sql` applied in Supabase
- [ ] `scripts/knockout-unique-index.sql` applied (blocks duplicate knockout pairs)
- [ ] Realtime publication includes `tournaments`, `teams`, `matches`, `pending_team_registrations` (see `REALTIME_SETUP.md`)
- [ ] One tournament marked **Active** in Admin
- [ ] Admin login works on production
- [ ] Logged-out browser cannot edit scores or change phase
- [ ] Score update on admin device appears on spectator device (LIVE or within ~30s POLLING)
- [ ] Passcode shared only with scorekeepers
- [ ] Follow `TOURNAMENT_DAY.md` smoke list on the live URL

Optional later (server writes + RLS): `ADMIN_API_ENABLED`, service role key, then `scripts/tighten-rls.sql` — see `ADMIN_SYSTEM.md`.

## Admin notes

- Session lasts 48 hours in the browser (`localStorage`)
- Mutating UI is gated with `requireAdmin()`
- Spectators cannot advance phase via bottom nav
- Knockout auto-advance runs only in admin browsers
- Rotate passcode by changing the env var and redeploying

Full trust model: `ADMIN_SYSTEM.md`.

## If deploy fails

1. Read the Vercel build log (`npm run build` must pass locally)
2. Confirm env vars are present on the Production environment
3. Confirm Supabase URL/key match the project that has the tables
