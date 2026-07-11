# Tournament Admin System

## Overview

The tournament uses a lightweight passcode-based admin model. There are no user accounts — trusted scorekeepers enter a shared passcode and get a 48-hour browser session.

This is intentional for a backyard / invite-only tournament day. It is **not** bank-grade auth.

## Trust model

| Layer | What it protects | What it does not |
|---|---|---|
| UI + `requireAdmin()` | Accidental spectator edits, casual tampering via the app UI | Anyone who opens DevTools and hits Supabase with the anon key |
| Admin passcode (env) | Who can unlock the UI | People who already know the passcode |
| Supabase RLS (open write) | Nothing — public write is enabled so the client-only architecture works | Real adversaries |

**Why RLS stays open:** this app talks to Supabase directly from the browser with the anon key. Locking writes in RLS would also lock out admins unless we add server-side API routes (service role) or Supabase Auth. That is a future hardening step, not tournament-day scope.

**Practical security for event day:**
1. Set a strong `NEXT_PUBLIC_ADMIN_PASSCODE` in Vercel (do not commit it)
2. Share the passcode only with scorekeepers
3. Prefer a short-lived / not widely shared site URL if possible
4. Rotate the passcode and redeploy if it leaks

## Protected operations

All of these require an active admin session:

- Score editing (pool play + knockout), including quick-score shortcuts
- Match generation (pool play schedule + knockout bracket)
- Knockout auto-advancement to the next round (admin browsers only)
- Team add / edit / delete / paid toggle / random team tools
- Start tournament / change phase / reset tournament / reset scores
- Tournament CRUD and pending registration approve/reject

Spectators see live data without edit controls. Bottom-nav phase tabs are locked for non-admins so spectators cannot advance the tournament by tapping around.

## Passcode configuration

```env
NEXT_PUBLIC_ADMIN_PASSCODE=your-strong-passcode
```

- **Production:** required. Login is disabled if unset.
- **Local/dev:** falls back to a well-known demo passcode so you can develop without env setup. Do not rely on that fallback in production.

Sessions store a fingerprint of the configured passcode. Rotating `NEXT_PUBLIC_ADMIN_PASSCODE` and redeploying invalidates existing browser sessions on next load (cross-tab sync via `storage` events).

## Single active tournament

The live app (scores, bracket, pending registrations, public signup) is scoped to **one** primary tournament:

1. Prefer `status = active` (latest date if more than one somehow exists)
2. Otherwise fall back to the latest-dated tournament

From **Admin → Tournament Management**, use **Make Active** to switch. Activating demotes any other active tournament to `upcoming` and reloads teams/matches for the new primary. Public `/register` only accepts signups for that live tournament while it is in the registration phase.

## How to use

### Organizers
1. Set `NEXT_PUBLIC_ADMIN_PASSCODE` in the deployment environment
2. Share the passcode with trusted scorekeepers before the event
3. Rotate and redeploy if access needs to be revoked

### Scorekeepers
1. Open `/admin` (or Admin Login from the menu)
2. Enter your name + the passcode
3. Session lasts 48 hours in that browser
4. Edit scores and manage the tournament from the main app

### Players / spectators
- Read-only viewing with live updates
- Public team registration at `/register` still works (queued for admin approval)

## Emergency procedures

### Unauthorized admin access
1. Change `NEXT_PUBLIC_ADMIN_PASSCODE` and redeploy
2. Have legitimate admins re-login
3. Spot-check recent scores / teams for unexpected changes

### Admin cannot login
1. Confirm `NEXT_PUBLIC_ADMIN_PASSCODE` is set in the environment
2. Check spelling / capitalization of the passcode
3. Try a private/incognito window
4. Clear site data for the domain

## Future hardening (optional)

- Supabase Auth or Next.js API routes with service-role writes
- Tighter RLS (public SELECT + authenticated INSERT/UPDATE)
- Audit log of score changes
- Role separation (scorekeeper vs organizer)
- Time-limited one-time admin codes

---

**Ready for tournament day** when the passcode is set in production and scorekeepers are briefed.
