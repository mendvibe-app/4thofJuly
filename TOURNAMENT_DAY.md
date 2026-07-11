# Tournament Day Checklist

For the Harbor Way 4th of July Soccer Tennis event.

## Before you leave home

- [ ] Production env on Vercel has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_ADMIN_PASSCODE` (strong, shared only with scorekeepers)
  - Optional later: `SUPABASE_SERVICE_ROLE_KEY` + `ADMIN_API_ENABLED=true` (server mutations)
- [ ] Supabase project is **not paused**
- [ ] SQL applied: `scripts/create-tables.sql`, `scripts/enable-realtime.sql` (or alternative)
- [ ] Optional race guard: `scripts/knockout-unique-index.sql`
- [ ] One tournament marked **Active** in Admin → Tournament Management
- [ ] Passcode texted to scorekeepers (not in a public channel)

## Preview / production smoke (5–10 min)

Use two browsers (or normal + private window).

1. **Connection** — open `/`. Badge should be **LIVE** (or **POLLING** is OK).
2. **Spectator** — logged-out window cannot edit scores or change live phase; can still browse tabs.
3. **Admin login** — `/admin` → name + passcode → return to `/` (same browser) and confirm score controls appear. Open a second tab of `/` and confirm it unlocks without refresh.
4. **Registration** — `/register` shows only the active tournament while in registration phase.
5. **Scores** — admin enters a pool score; spectator sees it (LIVE instant or ~30s POLLING). Quick Win should be **11–0** / close **11–9**.
6. **Knockout** — after pool (or with confirm on partial), Advance once. Second click should ask before regenerating. Two admin devices completing a round should not duplicate the next round.
7. **Make Active** — switching tournaments reloads the correct teams/matches.

## Day-of roles

| Role | Does |
|---|---|
| Organizer | Active tournament, phase advances, approve registrations, paid toggles |
| Scorekeeper | Enter pool + knockout scores on `/` after `/admin` login |
| Spectator / player | Watch `/`, optional `/register` / `/standings` / `/rules` |

## If something breaks

| Symptom | Fix |
|---|---|
| Admin login disabled | Set `NEXT_PUBLIC_ADMIN_PASSCODE` and redeploy |
| Wrong teams showing | Admin → Make Active on the correct tournament |
| Scores not syncing | Check LIVE/POLLING; confirm realtime publication; polling still works |
| Duplicate knockout matches | Regenerate with confirm (clears knockout first); apply unique index SQL |
| Passcode leaked | Change env passcode, redeploy — old sessions invalidate via fingerprint |

## Merge order (cleanup stack → main)

Prefer **one PR of the tip branch into `main`** (contains phases 0–10). Otherwise merge drafts bottom-up:

`#3` → `#4` → `#5` → `#6` → `#7` → `#8` → `#9` → `#10` → `#11` → ops/hardening tip

After merge: Vercel production deploy → re-run the smoke list above on the live URL.
