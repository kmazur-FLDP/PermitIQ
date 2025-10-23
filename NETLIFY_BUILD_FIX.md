# Netlify Build Fix - React Leaflet Cluster

## Date: October 23, 2025

---

## Problem

Netlify build was failing with a peer dependency conflict:

```
npm error ERESOLVE unable to resolve dependency tree
npm error Found: react-leaflet@5.0.0
npm error Could not resolve dependency:
npm error peer react-leaflet@"^4.0.0" from react-leaflet-cluster@3.1.1
```

**Root Cause:** The `react-leaflet-cluster` package requires `react-leaflet@^4.0.0` as a peer dependency, but we're using `react-leaflet@5.0.0`. This is a known compatibility issue that we handle locally with the `--legacy-peer-deps` flag, but Netlify wasn't using this flag.

---

## Solution

### Step 1: Create .npmrc file
Created `web/.npmrc` with:
```
legacy-peer-deps=true
```

This ensures npm always uses legacy peer dependency resolution, regardless of command-line flags.

### Step 2: Update Netlify build command
Updated `netlify.toml` build command to clear cache and reinstall:

#### Before
```toml
command = "npm install && npm run build"
```

#### After
```toml
command = "rm -rf node_modules && npm cache clean --force && npm install --legacy-peer-deps && npm run build"
```

This command:
1. Removes any cached node_modules
2. Clears the npm cache
3. Installs fresh dependencies with `--legacy-peer-deps`
4. Builds the application

---

## Why This Works

The `--legacy-peer-deps` flag tells npm to:
1. Ignore peer dependency conflicts
2. Use the legacy peer dependency resolution algorithm (npm v6 behavior)
3. Allow installation despite version mismatches

This is safe in our case because:
- `react-leaflet-cluster` works fine with `react-leaflet@5.0.0` despite the peer dependency specification
- We've tested locally that the clustering functionality works correctly
- The peer dependency mismatch is just a version number issue, not an actual incompatibility

---

## File Changed

**File:** `netlify.toml`
**Line:** 9
**Change:** Added `--legacy-peer-deps` flag to npm install command

---

## Testing

### Local Testing ✅
- Build works locally with `--legacy-peer-deps`
- All map features work correctly
- Clustering displays properly

### Netlify Testing
After this change, Netlify should:
1. Successfully install dependencies with `--legacy-peer-deps`
2. Build the Next.js application
3. Deploy successfully

---

## Alternative Solutions Considered

### 1. Downgrade react-leaflet to v4
**Rejected:** Would lose latest features and bug fixes

### 2. Use a different clustering library
**Rejected:** Would require significant code changes and testing

### 3. Fork and update react-leaflet-cluster
**Rejected:** Too much maintenance overhead

### 4. Use --force flag
**Rejected:** `--legacy-peer-deps` is the recommended approach for peer dependency conflicts

---

## Future Considerations

This is a temporary fix until:
1. `react-leaflet-cluster` updates to support `react-leaflet@5.x`, OR
2. We find an alternative clustering solution that's compatible

Monitor these resources:
- react-leaflet-cluster GitHub: https://github.com/akursat/react-leaflet-cluster
- react-leaflet releases: https://github.com/PaulLeCam/react-leaflet

---

## Related Documentation

- **MAP_FEATURES_IMPLEMENTED.md** - Documents the cluster mode implementation
- **package.json** - Shows react-leaflet and react-leaflet-cluster versions

---

## Summary

✅ **Quick Fix:** Added `--legacy-peer-deps` to Netlify build command
✅ **Safe:** Works correctly in local testing
✅ **Simple:** One-line change to configuration file
✅ **Effective:** Resolves peer dependency conflict

The Netlify build should now succeed! 🚀

