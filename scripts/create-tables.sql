-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  current_phase TEXT NOT NULL DEFAULT 'registration' CHECK (current_phase IN ('registration', 'pool-play', 'knockout')),
  bye_team_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pending team registrations table
CREATE TABLE IF NOT EXISTS pending_team_registrations (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  players TEXT[] NOT NULL,
  contact_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Create teams table (updated to include tournament_id)
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  players TEXT[] NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table (updated to include tournament_id)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team1_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  team2_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  phase TEXT NOT NULL CHECK (phase IN ('pool-play', 'knockout')),
  round INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy tournament_settings table (kept for backward compatibility, but tournaments table is preferred)
CREATE TABLE IF NOT EXISTS tournament_settings (
  id SERIAL PRIMARY KEY,
  current_phase TEXT NOT NULL DEFAULT 'registration' CHECK (current_phase IN ('registration', 'pool-play', 'knockout')),
  bye_team_id INTEGER REFERENCES teams(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial tournament settings
INSERT INTO tournament_settings (current_phase) VALUES ('registration') ON CONFLICT DO NOTHING;

-- Create a default tournament for existing data migration
INSERT INTO tournaments (name, date, status, current_phase) 
VALUES ('4th of July Tournament 2024', CURRENT_DATE, 'active', 'registration') 
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_team_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for tournaments
CREATE POLICY "Public can view tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public can insert tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Public can delete tournaments" ON tournaments FOR DELETE USING (true);

-- Create policies for pending team registrations
CREATE POLICY "Public can view pending_team_registrations" ON pending_team_registrations FOR SELECT USING (true);
CREATE POLICY "Public can insert pending_team_registrations" ON pending_team_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update pending_team_registrations" ON pending_team_registrations FOR UPDATE USING (true);
CREATE POLICY "Public can delete pending_team_registrations" ON pending_team_registrations FOR DELETE USING (true);

-- Create policies for teams (updated for tournament support)
CREATE POLICY "Public can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can insert teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update teams" ON teams FOR UPDATE USING (true);
CREATE POLICY "Public can delete teams" ON teams FOR DELETE USING (true);

-- Create policies for matches (updated for tournament support)
CREATE POLICY "Public can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "Public can delete matches" ON matches FOR DELETE USING (true);

-- Create policies for tournament_settings (legacy)
CREATE POLICY "Public can view tournament_settings" ON tournament_settings FOR SELECT USING (true);
CREATE POLICY "Public can update tournament_settings" ON tournament_settings FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_settings_updated_at BEFORE UPDATE ON tournament_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for tournaments.bye_team_id
ALTER TABLE tournaments ADD CONSTRAINT tournaments_bye_team_id_fkey 
FOREIGN KEY (bye_team_id) REFERENCES teams(id);
