# Real-time Updates

The app syncs tournament data across devices via Supabase Realtime, with a **30-second polling fallback** when the socket is not subscribed.

## Status badge

| Badge | Meaning |
|---|---|
| LIVE | Realtime channels subscribed |
| POLLING | Fallback interval refresh (~30s) |
| OFFLINE | Initial load / connection error |

Implemented in `hooks/use-tournament-data.tsx` and `components/connection-status-badge.tsx`.

## Enable Realtime in Supabase

Run in the SQL Editor (preferred):

`scripts/enable-realtime.sql`

Or the alternative that creates the publication if missing:

`scripts/enable-realtime-alternative.sql`

Tables that must be in `supabase_realtime`:

- `tournaments`
- `pending_team_registrations`
- `teams`
- `matches`

(`tournament_settings` is optional / legacy.)

Also set replica identity if updates seem incomplete:

```sql
ALTER TABLE tournaments REPLICA IDENTITY FULL;
ALTER TABLE pending_team_registrations REPLICA IDENTITY FULL;
ALTER TABLE teams REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;
```

## Verify

1. Open the app in two browsers
2. As admin, change a score
3. Expect LIVE instant update, or POLLING within ~30 seconds

## Troubleshooting

1. Confirm `.env.local` / Vercel env points at the correct project
2. Confirm publication tables via:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

3. Ensure the Supabase project is not paused
4. Polling alone is enough for tournament day if Realtime cannot be enabled
