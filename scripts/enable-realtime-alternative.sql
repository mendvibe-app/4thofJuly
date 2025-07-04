-- Alternative method to enable real-time without replication UI access
-- Run this script in your Supabase SQL Editor

-- First, check if supabase_realtime publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- If it doesn't exist, create it
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Add our tournament tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_settings;

-- Enable replica identity for real-time updates
ALTER TABLE teams REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;
ALTER TABLE tournament_settings REPLICA IDENTITY FULL;

-- Verify the setup
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Expected result: Should show teams, matches, and tournament_settings tables 