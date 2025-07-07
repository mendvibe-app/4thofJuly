-- Enable real-time for tournament tables
-- Run this script in your Supabase SQL editor

-- Enable real-time for tournaments table
ALTER publication supabase_realtime ADD TABLE tournaments;

-- Enable real-time for pending_team_registrations table
ALTER publication supabase_realtime ADD TABLE pending_team_registrations;

-- Enable real-time for teams table
ALTER publication supabase_realtime ADD TABLE teams;

-- Enable real-time for matches table  
ALTER publication supabase_realtime ADD TABLE matches;

-- Enable real-time for tournament_settings table
ALTER publication supabase_realtime ADD TABLE tournament_settings;

-- Verify real-time is enabled (run this to check)
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- If you see an error about supabase_realtime publication not existing, 
-- create it first:
-- CREATE PUBLICATION supabase_realtime FOR TABLE tournaments, pending_team_registrations, teams, matches, tournament_settings; 