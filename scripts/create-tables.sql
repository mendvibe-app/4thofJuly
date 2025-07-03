-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  players TEXT[] NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
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

-- Create tournament_settings table
CREATE TABLE IF NOT EXISTS tournament_settings (
  id SERIAL PRIMARY KEY,
  current_phase TEXT NOT NULL DEFAULT 'registration' CHECK (current_phase IN ('registration', 'pool-play', 'knockout')),
  bye_team_id INTEGER REFERENCES teams(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial tournament settings
INSERT INTO tournament_settings (current_phase) VALUES ('registration') ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (everyone can read and write)
CREATE POLICY "Public can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can insert teams" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update teams" ON teams FOR UPDATE USING (true);
CREATE POLICY "Public can delete teams" ON teams FOR DELETE USING (true);

CREATE POLICY "Public can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update matches" ON matches FOR UPDATE USING (true);
CREATE POLICY "Public can delete matches" ON matches FOR DELETE USING (true);

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
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_settings_updated_at BEFORE UPDATE ON tournament_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
