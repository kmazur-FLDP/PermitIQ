# Netlify Deployment Checklist - PermitIQ

## 🚨 Issue Found
Your `web/` directory files are **NOT in Git yet**. Netlify can't deploy what isn't committed!

## ✅ Step-by-Step Deployment

### 1. Commit Web Files to Git

```bash
cd /Users/kevinmazur/Documents/Kevin\ Work/PermitIQ

# Check what needs to be added
git status

# Add all web files (except .env.local which is gitignored)
git add web/ netlify.toml

# Commit
git commit -m "Add Next.js web application with Netlify config"

# Push to GitHub
git push origin main
```

### 2. Verify Files Are on GitHub

Go to: https://github.com/kmazur-FLDP/PermitIQ

You should see:
- ✅ `netlify.toml` in root
- ✅ `web/` directory with all your Next.js files
- ❌ NO `.env.local` files (these stay local/private)

### 3. Connect Netlify to GitHub

1. **Sign up/Login**: https://app.netlify.com/
2. **Add new site**: Click "Add new site" → "Import an existing project"
3. **Choose GitHub**: Select GitHub as source
4. **Select repository**: `kmazur-FLDP/PermitIQ`
5. **Configure build**:
   - Netlify should auto-detect `netlify.toml` ✅
   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/.next`

### 4. Add Environment Variables in Netlify

**CRITICAL**: In Netlify Dashboard → Site settings → Environment variables

Add these **3 required variables**:

```bash
# Get from: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://lqiglujleojwkcwfbxmr.supabase.co

# Get "anon/public" key (NOT service_role)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Get from: https://account.mapbox.com/ (free account)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoie...

# Update with your actual Netlify URL after first deploy
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

### 5. Deploy!

Click **"Deploy site"**

Netlify will:
1. Clone your repo ✅
2. Navigate to `web/` directory ✅
3. Run `npm install` ✅
4. Run `npm run build` ✅
5. Deploy to CDN ✅

**Expected build time**: 1-3 minutes

### 6. Verify Deployment

After successful deployment:

1. **Visit your site**: `https://your-site-name.netlify.app`
2. **Check homepage**: Should see PermitIQ landing page
3. **Open browser console**: Check for any errors
4. **Test navigation**: Click "Dashboard" and "Map View" links

---

## 🐛 Troubleshooting

### Build Error: "Module not found: Can't resolve '@/lib/utils'"

**Cause**: Web files not committed to Git

**Fix**: 
```bash
git add web/
git commit -m "Add web application files"
git push
```

Then trigger a new deploy in Netlify.

### Build Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Cause**: Environment variables not set in Netlify

**Fix**: 
1. Go to Netlify Dashboard
2. Site settings → Environment variables
3. Add all 3 required variables
4. Redeploy

### Build succeeds but site shows blank page

**Cause**: Missing Supabase anon key or incorrect configuration

**Fix**:
1. Open browser developer console
2. Look for CORS or API errors
3. Verify Supabase URL and anon key are correct
4. Check Supabase RLS policies allow public SELECT

### Images not loading

**Cause**: Next.js Image optimization not configured for static export

**Fix**: Already configured in `next.config.ts`:
```typescript
images: {
  unoptimized: true,
}
```

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All web files committed to Git
- [ ] Pushed to GitHub (`git push origin main`)
- [ ] `.env.local` is NOT committed (check with `git status`)
- [ ] `netlify.toml` is in repository root
- [ ] You have Supabase anon key ready
- [ ] You have Mapbox token ready (or can create one)
- [ ] GitHub repository is accessible by Netlify

---

## 🔄 Continuous Deployment

After initial setup, Netlify will automatically deploy when you:

```bash
# Make changes
git add .
git commit -m "Update homepage"
git push origin main

# Netlify auto-deploys! 🚀
```

**Build triggers**:
- Push to `main` branch → Auto deploy
- Pull request → Preview deploy
- Manual trigger in Netlify Dashboard

---

## 🎯 Next Steps After Deployment

1. **Custom domain** (optional)
   - Netlify Dashboard → Domain settings
   - Add your custom domain

2. **Enable HTTPS** (automatic)
   - Netlify provides free SSL certificate
   - Usually provisioned within 1 minute

3. **Set up preview deployments**
   - Create feature branches
   - Open pull requests
   - Get preview URLs for testing

4. **Monitor builds**
   - Check Netlify Dashboard → Deploys
   - View build logs for any issues

---

## 🚀 Quick Commands Reference

```bash
# Check what's not committed
git status

# Add web directory
git add web/ netlify.toml

# Commit with message
git commit -m "Add Next.js web application"

# Push to GitHub
git push origin main

# View Git log
git log --oneline -5

# Check remote repository
git remote -v
```

---

## 📊 Expected Build Output

Successful build will show:

```
9:58:57 AM: $ npm run build
9:58:58 AM: > web@0.1.0 build
9:58:58 AM: > next build
9:58:58 AM:    ▲ Next.js 16.0.0 (Turbopack)
9:58:58 AM:    Creating an optimized production build ...
9:59:01 AM: ✓ Compiled successfully
9:59:01 AM: ✓ Linting and checking validity of types
9:59:02 AM: ✓ Collecting page data
9:59:02 AM: ✓ Generating static pages
9:59:02 AM: ✓ Collecting build traces
9:59:02 AM: ✓ Finalizing page optimization
9:59:02 AM: Build complete!
```

---

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ Netlify provides a URL (e.g., `https://permitiq-abc123.netlify.app`)
- ✅ Homepage loads with PermitIQ branding
- ✅ No console errors in browser
- ✅ Navigation works (Dashboard, Map links)

---

**Current Status**: Ready to commit and deploy! 🚀

**First Action**: Run the git commands above to commit your web files.
