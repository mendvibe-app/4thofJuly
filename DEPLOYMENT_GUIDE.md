# Deployment Guide - 4th of July Tournament App

## Quick Deployment to Vercel (Recommended)

### Option 1: Deploy via GitHub Integration (Easiest)

1. **Go to Vercel.com**
   - Visit [https://vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account

2. **Import Your Project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your repository: `mendvibe-app/4thofJuly`
   - Click "Import"

3. **Configure Environment Variables**
   - In the Vercel dashboard, go to your project settings
   - Add these environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Deploy**
   - Vercel will automatically build and deploy
   - You'll get a production URL like: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## Alternative Deployment Options

### Netlify
1. Go to [https://netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables

### Manual Build & Deploy
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Environment Variables Required

Make sure to set these in your production environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Admin System - Production Notes

### Admin Passcodes
The admin system uses these passcodes (you can change them in `hooks/use-admin.ts`):
- `july4admin`
- `score2024`
- `official24`

### Security Features
- ✅ 4-hour session timeout
- ✅ Client-side only (no database storage)
- ✅ Multiple admin support
- ✅ Easy passcode rotation

### Production Checklist
- [ ] Environment variables configured
- [ ] Supabase database tables created
- [ ] Admin passcodes communicated to tournament staff
- [ ] Real-time subscriptions enabled in Supabase
- [ ] Test admin login on production site
- [ ] Test score updates with admin access

## Automatic Deployments

Once connected to Vercel/Netlify:
- Every push to `main` branch automatically deploys
- Preview deployments for pull requests
- Zero-downtime deployments
- Global CDN distribution

## Need Help?

If you encounter issues:
1. Check the build logs in your deployment platform
2. Verify environment variables are set correctly
3. Ensure Supabase connection is working
4. Test admin functionality after deployment

---

**Your tournament admin system is now ready for production! 🎆** 