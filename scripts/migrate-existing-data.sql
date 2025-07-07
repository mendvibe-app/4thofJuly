-- Migration script for existing tournament data to multi-tournament system
-- Run this AFTER creating the new tables if you have existing data

-- 1. First, ensure we have a default tournament
INSERT INTO tournaments (name, date, status, current_phase) 
VALUES ('4th of July Tournament 2024', CURRENT_DATE, 'active', 'registration') 
ON CONFLICT DO NOTHING;

-- 2. Get the default tournament ID
DO $$
DECLARE
    default_tournament_id INTEGER;
BEGIN
    -- Get the first tournament ID (should be our default)
    SELECT id INTO default_tournament_id FROM tournaments ORDER BY id LIMIT 1;
    
    -- 3. Update existing teams to reference the default tournament (if they don't already)
    -- First, add the column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teams' AND column_name = 'tournament_id') THEN
        ALTER TABLE teams ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
    END IF;
    
    -- Update teams without tournament_id
    UPDATE teams 
    SET tournament_id = default_tournament_id 
    WHERE tournament_id IS NULL;
    
    -- Make tournament_id NOT NULL after populating
    ALTER TABLE teams ALTER COLUMN tournament_id SET NOT NULL;
    
    -- 4. Update existing matches to reference the default tournament (if they don't already)
    -- First, add the column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'tournament_id') THEN
        ALTER TABLE matches ADD COLUMN tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE;
    END IF;
    
    -- Update matches without tournament_id
    UPDATE matches 
    SET tournament_id = default_tournament_id 
    WHERE tournament_id IS NULL;
    
    -- Make tournament_id NOT NULL after populating
    ALTER TABLE matches ALTER COLUMN tournament_id SET NOT NULL;
    
    -- 5. Migrate tournament settings to the tournaments table
    UPDATE tournaments 
    SET current_phase = (SELECT current_phase FROM tournament_settings ORDER BY id LIMIT 1),
        bye_team_id = (SELECT bye_team_id FROM tournament_settings ORDER BY id LIMIT 1)
    WHERE id = default_tournament_id;
    
    RAISE NOTICE 'Migration completed successfully. Default tournament ID: %', default_tournament_id;
END $$; 