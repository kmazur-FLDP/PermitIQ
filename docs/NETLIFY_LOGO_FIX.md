# Netlify Logo Display Fix

## Date: October 23, 2025

---

## Problem

The FLDP logo (`fldp_final_color.png`) was not displaying on the production Netlify site, showing a broken image or "image not found" error.

---

## Root Cause

The issue was with the `netlify.toml` configuration. The `publish` directory was explicitly set to `.next`, which conflicts with how the `@netlify/plugin-nextjs` plugin handles Next.js deployments.

When using the Netlify Next.js plugin, the plugin automatically manages the publish directory and file structure. Setting a custom `publish = ".next"` can cause issues with:
- Static asset serving (images in `/public`)
- Proper Next.js build output structure
- Image optimization routing

---

## Solution

Updated `netlify.toml` to let the Next.js plugin automatically handle the publish directory:

### Before
```toml
[build]
  base = "web"
  command = "rm -rf node_modules && npm cache clean --force && npm install --legacy-peer-deps && npm run build"
  publish = ".next"  # ❌ This was causing the issue

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### After
```toml
[build]
  base = "web"
  command = "rm -rf node_modules && npm cache clean --force && npm install --legacy-peer-deps && npm run build"
  # publish directive removed - plugin handles this ✅

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## Why This Works

The `@netlify/plugin-nextjs` plugin:
1. Automatically detects Next.js build output
2. Properly serves static assets from `/public`
3. Handles Next.js image optimization
4. Sets up correct routing for all Next.js features

By removing the explicit `publish` directive, we let the plugin do its job correctly.

---

## File Changes

**File:** `netlify.toml`
**Change:** Commented out `publish = ".next"` line

**Before:**
```toml
publish = ".next"
```

**After:**
```toml
# Publish directory - let the Next.js plugin handle this automatically
# publish = ".next"  # Commented out - plugin manages this
```

---

## Verification

### Local Testing ✅
- Logo displays correctly at `/fldp_final_color.png`
- Build completes successfully
- Image file exists in `web/public/fldp_final_color.png`

### Netlify Testing
After deploying with this change:
1. Logo should display in header on all pages
2. Next.js Image component will work correctly
3. All public assets should be accessible

---

## How Next.js Image Component Works

The logo is used with Next.js Image component:
```tsx
<Image
  src="/fldp_final_color.png"
  alt="FLDP Logo"
  fill
  sizes="96px"
  className="object-contain"
  priority
/>
```

Files in `/public` are served from the root URL, so:
- File location: `web/public/fldp_final_color.png`
- URL path: `/fldp_final_color.png`
- Netlify serves this correctly when plugin manages the publish directory

---

## Alternative Solutions Considered

### 1. Use `unoptimized` flag on Image
**Rejected:** Would disable image optimization, losing performance benefits

### 2. Change to `<img>` tag instead of Next.js Image
**Rejected:** Would lose automatic optimization, lazy loading, and responsive images

### 3. Set `publish = "public"`
**Rejected:** Would break Next.js routing and server-side features

### 4. Let plugin manage publish directory (CHOSEN)
**Accepted:** This is the recommended approach for Netlify Next.js deployments

---

## Next.js Plugin Documentation

According to Netlify's Next.js plugin documentation:
- The plugin automatically detects and publishes the Next.js build output
- You should NOT set a custom `publish` directory when using the plugin
- The plugin handles both static and server-side rendering correctly

Reference: https://docs.netlify.com/frameworks/next-js/overview/

---

## Summary

✅ **Removed custom publish directory** from netlify.toml
✅ **Let @netlify/plugin-nextjs manage deployment** automatically
✅ **Logo file confirmed in web/public/** directory
✅ **Image component usage is correct** (relative path from /public)

The logo should now display correctly on the production Netlify site! 🎉

---

## If Logo Still Doesn't Appear

If the logo still doesn't show after this change, try these additional steps:

1. **Clear Netlify cache:**
   - Go to Netlify Dashboard → Site Settings → Build & Deploy
   - Click "Clear cache and deploy site"

2. **Check Netlify build logs:**
   - Look for any warnings about missing files
   - Verify the build includes the public directory

3. **Check browser console:**
   - Open DevTools → Console tab
   - Look for 404 errors on the image URL
   - Note the exact URL being requested

4. **Verify file case sensitivity:**
   - Ensure filename is exactly `fldp_final_color.png` (lowercase)
   - Linux/Netlify servers are case-sensitive

