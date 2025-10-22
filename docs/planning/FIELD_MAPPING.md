# SWFWMD API Field Mapping

## Discovery Summary

**Date**: October 22, 2025  
**Records Analyzed**: 100 samples  
**Total Fields**: 32

## ⚠️ Important Findings

### 1. No Spatial Coordinates
- **Issue**: All 100 sampled records have NO geometry (x/y coordinates)
- **Impact**: Map visualization will not work without coordinates
- **Possible Reasons**:
  - Some permits may not have location data
  - API parameter might need adjustment
  - Data may need geocoding from addresses
  
### 2. Missing Location Fields
- **No County field** in API response
- **No City field** in API response
- **No Address field** in API response

These fields exist in our database schema but are not provided by the API.

### 3. Date Format
All dates are Unix timestamps in **milliseconds** since epoch:
- Example: `1047427200000` = March 12, 2003

## Field Mappings

### ✅ Successfully Mapped

| Database Field | API Field | Notes |
|----------------|-----------|-------|
| `objectid` | `OBJECTID` | Unique identifier |
| `permit_number` | `ERP_PERMIT_NBR` | Integer, converted to string |
| `applicant_name` | `PERMITTEE_NAME` | Name of permit holder |
| `company_name` | `PERMITTEE_NAME` | Same as applicant (no separate field) |
| `permit_type` | `ERP_PERMIT_TYPE_DESC` | e.g., "Standard General" |
| `permit_status` | `ERP_STATUS_DESC` | e.g., "Approved" |
| `activity_description` | `ERP_ACTIVITY_DESC` | e.g., "COMMERCIAL" |
| `application_date` | `APPLICATION_RECEIVED_DT` | Unix timestamp (ms) |
| `issue_date` | `PERMIT_ISSUE_DT` | Unix timestamp (ms) |
| `expiration_date` | `EXPIRATION_DT` | Unix timestamp (ms) |
| `last_modified_date` | `LAST_UPDATE_DT` | Unix timestamp (ms) |
| `project_name` | `PROJECT_NAME` | Project name |
| `acreage` | `PROJECT_ACRES_MS` | Float, project acreage |

### ❌ Not Available in API

| Database Field | Status |
|----------------|--------|
| `county` | Not in API |
| `city` | Not in API |
| `address` | Not in API |
| `project_type` | Not in API |
| `latitude` | No geometry in samples |
| `longitude` | No geometry in samples |
| `geometry` | No geometry in samples |

## Additional API Fields (Not Currently Used)

These fields are available but not mapped to our schema:

- `ERP_APPLICATION_ID` - Internal application ID
- `ERP_LABEL_TXT` - Permit label (e.g., "6.6")
- `ERP_REVISION_NBR` - Revision number
- `ERP_EXT_URL` - External URL to permit details
- `PERMIT_DEPARTMENT_NAME` - Department (e.g., "TAMPA")
- `OWNED_ACRES_MS` - Owned acreage (vs project acreage)
- `REPRESENTS` - What the permit represents
- `SHAPE.AREA` - Shape area (present even without coords)
- `SHAPE.LEN` - Shape length
- `LETTER_MOD_FLG` - Letter modification flag
- Various inspector fields (`ERP_ENG_AD_NAME`, etc.)
- Construction/operation dates

## Recommendations

### 1. Geometry Issue (Critical)
**Options:**
- Check if API has a different endpoint with coordinates
- Look for a different `outSR` (spatial reference) parameter
- Geocode addresses if they become available
- **ACTION**: Investigate why geometry is missing

### 2. Location Data (High Priority)
- County/city/address missing from API
- Consider:
  - Geocoding if coordinates are found
  - Reverse geocoding from coordinates
  - Using department name as proxy for region

### 3. Enhanced Fields (Optional)
Consider adding these useful fields from API:
- `ERP_EXT_URL` - Link to full permit details
- `PERMIT_DEPARTMENT_NAME` - Regional office
- `ERP_REVISION_NBR` - Track permit revisions

## Next Steps

Before loading data:

1. ✅ **Field mappings updated** in `fetch_permits.py`
2. ⚠️ **Investigate geometry issue** - why no coordinates?
3. ⚠️ **Consider**: Load without geometry for now, fix later?

## Sample Record

```json
{
  "OBJECTID": 1,
  "ERP_PERMIT_NBR": 6,
  "PERMITTEE_NAME": "Coastal Equity LLC",
  "ERP_PERMIT_TYPE_DESC": "Standard General",
  "ERP_STATUS_DESC": "Approved",
  "ERP_ACTIVITY_DESC": "COMMERCIAL",
  "APPLICATION_RECEIVED_DT": 1047427200000,
  "PERMIT_ISSUE_DT": 1054166400000,
  "EXPIRATION_DT": 1212019200000,
  "PROJECT_NAME": "PARSONS MEDICAL CENTER",
  "PROJECT_ACRES_MS": 2.14,
  "PERMIT_DEPARTMENT_NAME": "TAMPA"
}
```

## Full Report

See `docs/planning/api_field_discovery.json` for complete field analysis.

---

**Status**: Field mappings updated, ready to load data (but note geometry limitations)
