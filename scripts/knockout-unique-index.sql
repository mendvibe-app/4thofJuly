-- Prevent duplicate knockout pairings when two admins advance the same round.
-- Safe to re-run. Run in Supabase SQL Editor after create-tables.sql.

CREATE UNIQUE INDEX IF NOT EXISTS matches_knockout_pair_unique
ON matches (
  tournament_id,
  phase,
  round,
  LEAST(team1_id, team2_id),
  GREATEST(team1_id, team2_id)
)
WHERE phase = 'knockout'
  AND team1_id IS NOT NULL
  AND team2_id IS NOT NULL
  AND round IS NOT NULL;

-- Optional: at most one open (incomplete) slot per round slot is harder without
-- a slot column; the pair unique index covers the common double-insert case.
