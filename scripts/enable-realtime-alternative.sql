-- Alternative method to enable real-time without replication UI access
-- Run this script in your Supabase SQL Editor

SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_team_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

ALTER TABLE tournaments REPLICA IDENTITY FULL;
ALTER TABLE pending_team_registrations REPLICA IDENTITY FULL;
ALTER TABLE teams REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;

SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
