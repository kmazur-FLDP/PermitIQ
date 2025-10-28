# Heatmap Intensity Enhancement

## Problem

The heatmap works great with 5 years of data, but when filtering to shorter date ranges (like 3, 6, or 9 months), the heatmap becomes barely visible because there are fewer permits to display.

## Solution

Implemented **dynamic intensity scaling** that automatically adjusts the heatmap intensity based on:
1. The selected date range
2. The number of permits in the filtered dataset

## Changes Made

### 1. HeatmapLayer.tsx

**Added dynamic intensity calculation:**

```typescript
const getIntensityMultiplier = (range: DateRange, permitCount: number): number => {
  // Base intensity increases for smaller datasets
  if (range === '30') return permitCount < 100 ? 8.0 : permitCount < 500 ? 5.0 : 3.0
  if (range === '60') return permitCount < 200 ? 6.0 : permitCount < 1000 ? 4.0 : 2.5
  if (range === '90') return permitCount < 300 ? 5.0 : permitCount < 1500 ? 3.5 : 2.0
  if (range === '180') return permitCount < 500 ? 4.0 : permitCount < 2000 ? 3.0 : 1.8
  if (range === '365') return permitCount < 1000 ? 3.0 : permitCount < 3000 ? 2.0 : 1.5
  return 1.0 // 'all' time or 5 years - use default
}
```

**How it works:**
- **30 days**: 3x - 8x intensity boost (depending on permit count)
- **60 days**: 2.5x - 6x intensity boost
- **90 days**: 2x - 5x intensity boost
- **180 days (6 months)**: 1.8x - 4x intensity boost
- **365 days (1 year)**: 1.5x - 3x intensity boost
- **All time / 5 years**: 1x intensity (default)

The multiplier scales with the permit count - fewer permits get higher intensity to remain visible.

**Component changes:**
- Added `dateRange` prop to HeatmapLayer interface
- Pass dateRange to intensity calculation
- Apply multiplier to each data point: `0.5 * intensityMultiplier`

### 2. PermitMap.tsx

**Passed dateRange to HeatmapLayer:**

```tsx
<HeatmapLayer permits={displayedPermits} dateRange={dateRange} />
```

This allows the heatmap to know what date range is selected and adjust intensity accordingly.

## Date Range Options

The dropdown already includes:
- ✅ All Time
- ✅ Last 30 Days
- ✅ Last 60 Days
- ✅ Last 90 Days
- ✅ Last 6 Months (180 days)
- ✅ **Last Year (365 days)** - Already present!

Note: "Last Year" option already exists in the dropdown as `<option value="365">Last Year</option>`

## Results

### Before:
- 6-month filter: Heatmap barely visible ❌
- 3-month filter: Almost invisible ❌
- User frustration with short date ranges ❌

### After:
- 6-month filter: 1.8x - 4x intensity boost ✅
- 3-month filter: 2x - 5x intensity boost ✅
- Automatically scales based on data density ✅
- 5-year view unchanged (optimal intensity) ✅

## Technical Details

**Intensity Calculation Logic:**

1. **Permit count threshold system:**
   - Very small datasets (< 100-500 permits): Maximum boost
   - Small datasets (500-2000 permits): Medium boost
   - Larger datasets (2000+ permits): Smaller boost
   
2. **Date range scaling:**
   - Shorter ranges get higher base multipliers
   - Ensures visibility even with sparse data
   
3. **Preserves visual hierarchy:**
   - High-density areas still appear "hotter"
   - Relative differences maintained
   - Just more visible overall

**Performance:**
- No performance impact (same rendering engine)
- Calculation happens once per filter change
- Lightweight math operations

## Testing

To verify the changes work:

1. **Test with 5-year data (baseline):**
   - Select "5 Years" data range
   - Switch to Heatmap view
   - Heatmap should look normal (no change)

2. **Test with 6-month filter:**
   - Select "Last 6 Months" date range
   - Switch to Heatmap view
   - Heatmap should be clearly visible (much brighter than before)

3. **Test with 3-month filter:**
   - Select "Last 90 Days" date range
   - Switch to Heatmap view
   - Heatmap should be very visible (brightest enhancement)

4. **Test edge cases:**
   - Try counties with very few permits + short date range
   - Should still show visible heatmap
   - Try high-density areas - should maintain relative intensity

## Files Modified

- `web/src/components/HeatmapLayer.tsx` - Added dynamic intensity calculation
- `web/src/components/PermitMap.tsx` - Pass dateRange prop to HeatmapLayer

## Future Enhancements

Potential improvements if needed:
- Add user-controlled intensity slider
- Store intensity preference in local storage
- Different color gradients for different date ranges
- Animate intensity transition when changing filters

---

**Issue**: Heatmap barely visible with short date ranges  
**Fix**: Dynamic intensity scaling based on date range and permit count  
**Date**: October 24, 2025  
**Impact**: All date range filters now show visible heatmaps
