# 4th of July Soccer Tennis Tournament App

## Project Overview
This is a tournament management app for the annual Harbor Way 4th of July Soccer Tennis Tournament. The app handles team registration, payment tracking, pool play (round robin), knockout brackets, and live scoring.

## Current Status
- Built initially in v0.dev (50 versions of iteration)
- Connected to Supabase for real-time database
- Deployed on Vercel with GitHub integration
- Recently migrated to local development with Cursor

## Key Features Implemented
1. **Team Registration**: Add teams with player names and payment tracking ($40/team)
2. **Pool Play**: Round robin format ensuring 3+ games per team
3. **Knockout Bracket**: Single elimination with proper seeding
4. **Live Scoring**: Real-time score updates via Supabase
5. **Mobile Optimized**: Designed for outdoor tournament use

## Current Teams Registered (6 total)
1. "In it to Win it" - Mikey & Lance
2. "Bangin' Aces" - Koji & Banghart  
3. "Guadalajara" - Richie & Jario
4. "Izzy Does It" - Matt & Izzy
5. "Dream Team" - Abe & Nick
6. "A to Z" - Z. Speed & A. Speed (defending champions)

## Technical Stack
- Next.js 14 with TypeScript
- React with hooks for state management
- Supabase for real-time database
- Tailwind CSS for styling
- Vercel for deployment

## Database Schema (Supabase)
- `teams` table: id, name, player1, player2, paid, created_at
- `matches` table: id, team1_id, team2_id, score1, score2, completed, round_type, round_number
- `tournament_settings` table: current_phase, pool_play_complete, knockout_started

## Known Issues from v0 Development
- Import path issues with `@/hooks/use-tournament-data`
- Supabase connection intermittently fails
- Pool play bracket generation logic needs refinement
- Mobile responsiveness on score input could be improved

## Files Structure
- `app/page.tsx` - Main tournament interface
- `hooks/use-tournament-data.ts` - Supabase integration hook
- `lib/supabase.ts` - Supabase client configuration
- `components/` - Reusable UI components
- `scripts/create-tables.sql` - Database schema

## Environment Variables Needed
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Tournament Rules
- Soccer tennis with drinking rules
- Guarantee 3+ games per team
- Pool play for seeding, then knockout
- $20/player entry ($10 pizza, $10 prize pool)