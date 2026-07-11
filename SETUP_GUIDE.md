# Tournament App Setup Guide

## 🔥 Critical Issues Found & Solutions

### 1. **Environment Variables Missing** ❌
**Problem**: Supabase connection will fail without proper environment variables.

**Solution**: Create a `.env.local` file in the root directory with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

**How to get these values**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 2. **Database Tables Missing** ❌
**Problem**: Database tables don't exist yet.

**Solution**: Run the SQL script in Supabase:
1. Go to your Supabase project → SQL Editor
2. Copy and paste the contents of `scripts/create-tables.sql`
3. Click "Run" to create all tables and policies

### 3. **Import Paths** ✅
**Status**: Actually working correctly! The `@/*` path mapping is properly configured.

## 🚀 Step-by-Step Setup Process

### Step 1: Environment Setup
```bash
# Copy the example env file and fill in values
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   NEXT_PUBLIC_ADMIN_PASSCODE=...   # optional locally; required in production
```

### Step 2: Database Setup
- Run the `scripts/create-tables.sql` in Supabase SQL Editor
- This creates: teams, matches, tournament_settings tables
- Sets up Row Level Security policies for public access

### Step 3: Test Connection
```bash
npm run dev
```
- Open http://localhost:3000
- Should see "🔴 LIVE Tournament - Everyone Can Participate!" if connected
- Should see "❌ Database Connection Error" if environment/DB issues

### Step 4: Test Tournament Flow
1. **Registration Phase**: Add teams and mark them as paid
2. **Pool Play**: Generate matches, input scores
3. **Knockout**: Generate bracket, complete tournament

## 🔍 Debugging Checklist

### Connection Issues
- [ ] `.env.local` file exists with correct Supabase credentials
- [ ] Database tables created via SQL script
- [ ] Supabase project is active (not paused)
- [ ] Check browser console for detailed error messages

### Import Issues
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Verify all components exist in `components/` directory
- [ ] Check that `types/tournament.ts` exports are correct

### Database Issues
- [ ] Run SQL script in Supabase SQL Editor
- [ ] Check Supabase logs for connection attempts
- [ ] Verify RLS policies allow public access
- [ ] Test with simple SELECT query in Supabase

## 🎯 Key Features to Test

1. **Team Registration**
   - Add new teams
   - Mark teams as paid ($40 each)
   - Edit/delete teams

2. **Pool Play**
   - Generate round-robin matches
   - Input live scores
   - See real-time standings

3. **Knockout Bracket**
   - Generate bracket from pool standings
   - Handle bye teams (if odd number)
   - Complete tournament

## 📱 Mobile Testing
- Test on mobile device for outdoor tournament use
- Verify score input is easy with touch interface
- Check real-time updates work across devices

## 🐛 Common Errors & Solutions

**"Cannot read properties of undefined"**
→ Environment variables not set

**"Table 'teams' doesn't exist"**
→ SQL script not run in Supabase

**"Import path errors"**
→ Actually false alarm - imports are working

**"Connection timeout"**
→ Check Supabase project status and network 