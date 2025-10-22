# GitHub Actions Setup Guide

This guide walks you through setting up automated daily ETL runs for PermitIQ using GitHub Actions.

## Overview

The PermitIQ ETL pipeline is configured to run automatically every day at 7:00 AM EST via GitHub Actions. This ensures your competitive intelligence data stays up-to-date with the latest permit information from SWFWMD.

## Required Secrets

You need to configure three repository secrets in GitHub:

### 1. `PERMITIQ_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Current Value**: `https://lqiglujleojwkcwfbxmr.supabase.co`
- **How to Find**: 
  - Go to your Supabase project dashboard
  - Navigate to Settings → API
  - Copy the "Project URL" value

### 2. `PERMITIQ_SUPABASE_SERVICE_KEY`
- **Description**: Your Supabase service role key (has full database access)
- **Security**: ⚠️ **NEVER** commit this to git or share publicly
- **How to Find**: 
  - Go to your Supabase project dashboard
  - Navigate to Settings → API
  - Copy the "service_role" key (not the "anon" key)
  - This key bypasses Row Level Security policies

### 3. `PERMITIQ_SWFWMD_API_URL`
- **Description**: The SWFWMD ArcGIS REST API endpoint
- **Current Value**: `https://www25.swfwmd.state.fl.us/arcgis10/rest/services/Permits/ErpViewerERPs/MapServer/0`
- **Note**: This is a public API, but we store it as a secret for easy configuration changes

## Step-by-Step Setup

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository: `https://github.com/kmazur-FLDP/PermitIQ`
2. Click on **Settings** (top navigation bar)
3. In the left sidebar, expand **Secrets and variables**
4. Click on **Actions**

### Step 2: Add Each Secret

For each of the three secrets listed above:

1. Click **New repository secret**
2. Enter the **Name** exactly as shown (e.g., `PERMITIQ_SUPABASE_URL`)
3. Paste the corresponding **Secret value**
4. Click **Add secret**

### Step 3: Verify Workflow File

The workflow file is already configured at `.github/workflows/daily-etl.yml`. It should contain:

```yaml
name: Daily ETL Pipeline

on:
  schedule:
    - cron: '0 12 * * *'  # 7 AM EST (12:00 UTC)
  workflow_dispatch:  # Allows manual triggering

env:
  PERMITIQ_SUPABASE_URL: ${{ secrets.PERMITIQ_SUPABASE_URL }}
  PERMITIQ_SUPABASE_SERVICE_KEY: ${{ secrets.PERMITIQ_SUPABASE_SERVICE_KEY }}
  PERMITIQ_SWFWMD_API_URL: ${{ secrets.PERMITIQ_SWFWMD_API_URL }}
```

### Step 4: Test Manual Run

After adding secrets:

1. Go to **Actions** tab in your GitHub repository
2. Click on **Daily ETL Pipeline** workflow
3. Click **Run workflow** dropdown
4. Select `main` branch
5. Click **Run workflow** button
6. Monitor the execution and check logs

### Step 5: Verify Automated Schedule

The workflow is scheduled to run daily at 7:00 AM EST. After setup:

- First automated run will occur the next day at 7 AM EST
- You can view run history in the Actions tab
- Each run will show logs, duration, and success/failure status

## Monitoring & Troubleshooting

### View Execution Logs

1. Go to **Actions** tab
2. Click on any workflow run
3. Click on the job name (e.g., "run-etl")
4. Expand step logs to see detailed output

### Common Issues

#### ❌ Secret not found
**Error**: `Error: Secret PERMITIQ_SUPABASE_URL not found`
**Solution**: Double-check secret name spelling (case-sensitive)

#### ❌ Authentication failed
**Error**: `401 Unauthorized` or `Invalid API key`
**Solution**: Verify you're using the service_role key, not anon key

#### ❌ Python package errors
**Error**: `ModuleNotFoundError: No module named 'supabase'`
**Solution**: This shouldn't happen as dependencies are installed in workflow. Check workflow file.

#### ❌ API rate limiting
**Error**: `429 Too Many Requests`
**Solution**: SWFWMD API has rate limits. Workflow includes retry logic with backoff.

### Email Notifications

GitHub automatically sends email notifications for workflow failures:
- Configure in: Settings → Notifications → Actions
- Choose to receive notifications for:
  - Only failures
  - All runs
  - Disabled

## Manual ETL Execution (Local)

If you need to run ETL manually from your local machine:

```bash
# Navigate to project directory
cd /Users/kevinmazur/Documents/Kevin\ Work/PermitIQ

# Activate virtual environment
source venv/bin/activate

# Run ETL pipeline
python etl/fetch_permits.py

# Or run with dry-run mode (no database writes)
python etl/fetch_permits.py --dry-run
```

## Workflow Configuration Details

### Schedule
- **Cron**: `0 12 * * *` (12:00 UTC = 7:00 AM EST)
- **Frequency**: Daily
- **Timezone**: UTC (converted to EST in documentation for clarity)

### Timeout
- **Job timeout**: 30 minutes
- **Typical duration**: ~3-5 minutes for full ETL run

### Python Version
- **Version**: 3.13
- **Managed by**: actions/setup-python@v4

### Dependencies
Installed from `requirements.txt`:
- supabase>=2.0.0
- requests>=2.31.0
- python-dotenv>=1.0.0

## Security Best Practices

✅ **DO**:
- Use service_role key for GitHub Actions (needs full access)
- Rotate keys periodically (every 90 days recommended)
- Monitor workflow execution logs for suspicious activity
- Use branch protection rules to prevent unauthorized workflow changes

❌ **DON'T**:
- Commit secrets to `.env` file in git
- Share service_role key via email/chat
- Use anon key for ETL (lacks necessary permissions)
- Store secrets in workflow file directly

## Updating Secrets

To update a secret value:

1. Go to Settings → Secrets and variables → Actions
2. Click on the secret name
3. Click **Update secret**
4. Enter new value
5. Click **Update secret**

Note: Workflow runs will use the new value immediately on the next execution.

## Next Steps

After GitHub Actions is configured:

1. ✅ Wait for first automated run (next day at 7 AM EST)
2. ✅ Verify data is being updated daily in Supabase
3. ✅ Check `erp_statistics` table for daily permit counts
4. ✅ Monitor `erp_permits.updated_at` timestamps
5. ✅ Set up email alerts for workflow failures

## Support

For issues with:
- **GitHub Actions**: Check [GitHub Actions documentation](https://docs.github.com/en/actions)
- **Supabase API**: Check [Supabase documentation](https://supabase.com/docs)
- **SWFWMD API**: Available 6 AM - 10 PM EST, contact SWFWMD if issues persist
- **PermitIQ ETL**: Check logs in Actions tab or run locally for debugging

---

**Last Updated**: October 22, 2025  
**Workflow File**: `.github/workflows/daily-etl.yml`  
**Python Version**: 3.13.7
