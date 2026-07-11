-- OPTIONAL: tighten RLS after SUPABASE_SERVICE_ROLE_KEY is configured and
-- ADMIN_API_ENABLED=true routes admin writes through /api/admin/*.
--
-- Do NOT run this before server mutations are live — it will lock out the
-- browser anon key from score updates.
--
-- Public stays able to: read everything, submit pending registrations.
-- Writes to teams/matches/tournaments require service role (API routes).

BEGIN;

-- Drop open write policies (names from create-tables.sql)
DROP POLICY IF EXISTS "Public can insert tournaments" ON tournaments;
DROP POLICY IF EXISTS "Public can update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Public can delete tournaments" ON tournaments;

DROP POLICY IF EXISTS "Public can insert teams" ON teams;
DROP POLICY IF EXISTS "Public can update teams" ON teams;
DROP POLICY IF EXISTS "Public can delete teams" ON teams;

DROP POLICY IF EXISTS "Public can insert matches" ON matches;
DROP POLICY IF EXISTS "Public can update matches" ON matches;
DROP POLICY IF EXISTS "Public can delete matches" ON matches;

DROP POLICY IF EXISTS "Public can update pending_team_registrations" ON pending_team_registrations;
DROP POLICY IF EXISTS "Public can delete pending_team_registrations" ON pending_team_registrations;

-- Keep SELECT public; keep INSERT on pending registrations for /register
-- (approve/reject goes through service-role API)

COMMIT;

-- Rollback plan: re-run the CREATE POLICY section of scripts/create-tables.sql
