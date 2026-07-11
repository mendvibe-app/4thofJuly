-- Enable real-time for tournament tables
-- Run this script in your Supabase SQL editor

ALTER publication supabase_realtime ADD TABLE tournaments;
ALTER publication supabase_realtime ADD TABLE pending_team_registrations;
ALTER publication supabase_realtime ADD TABLE teams;
ALTER publication supabase_realtime ADD TABLE matches;

-- Optional legacy table (app no longer reads phase/bye from here)
-- ALTER publication supabase_realtime ADD TABLE tournament_settings;

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- If publication is missing, create it:
-- CREATE PUBLICATION supabase_realtime FOR TABLE
--   tournaments, pending_team_registrations, teams, matches;
