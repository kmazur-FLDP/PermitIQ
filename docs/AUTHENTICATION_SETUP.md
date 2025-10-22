# Authentication Setup Guide

This guide will walk you through setting up your first user account for PermitIQ.

## Prerequisites

- Supabase project URL: `lqiglujleojwkcwfbxmr.supabase.co`
- Admin email: `kmmazur@fldandp.com`
- Admin UUID: `538caddc-b2f3-499f-ab1d-507bd7243841`

## Step-by-Step Setup

### Step 1: Create Supabase Auth User (Dashboard Method - Recommended)

1. **Navigate to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/auth/users

2. **Create New User**
   - Click the **"Add user"** button in the top right
   - Select **"Create new user"**

3. **Fill in User Details**
   - **Email**: `kmmazur@fldandp.com`
   - **Password**: Choose a secure password (remember this!)
   - **Auto Confirm User**: ✓ **CHECK THIS BOX** (important - skips email verification)
   - Leave other fields as default

4. **Create User**
   - Click **"Create user"**
   - User will appear in the list with a UUID

5. **Verify the UUID** (IMPORTANT!)
   - Click on the user to view details
   - Check if the UUID matches: `538caddc-b2f3-499f-ab1d-507bd7243841`
   - If it doesn't match, note the actual UUID (you'll need it for Step 2)

### Step 2: Create User Profile

1. **Navigate to SQL Editor**
   - URL: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/sql

2. **Create New Query**
   - Click **"New query"** button

3. **Run the Profile Script**
   - Copy the contents of `scripts/create_admin_profile.sql`
   - **If the UUID from Step 1 was different**, update the UUID in the SQL script
   - Paste and click **"Run"**

4. **Verify Success**
   - You should see 1 row inserted
   - The verification query at the end should show your profile

### Step 3: Test Login

1. **Start Local Dev Server** (if not running)
   ```bash
   cd web
   npm run dev
   ```

2. **Open Login Page**
   - Navigate to: http://localhost:3000/login

3. **Login with Credentials**
   - **Email**: `kmmazur@fldandp.com`
   - **Password**: (the password you set in Step 1)
   - Click **"Sign in with password"**

4. **Verify Redirect**
   - Should redirect to: http://localhost:3000/dashboard
   - Should see your name "Kevin Mazur" in the header
   - Should see admin role badge
   - Should see profile information

### Step 4: Test Magic Link (Optional)

1. **Logout**
   - Click "Sign Out" in the dashboard

2. **Request Magic Link**
   - Go to login page: http://localhost:3000/login
   - Enter email: `kmmazur@fldandp.com`
   - Click **"Send magic link"**

3. **Check Email**
   - Open email from Supabase
   - Click the magic link
   - Should redirect to dashboard

4. **Configure Email Provider** (if magic link doesn't work)
   - Go to: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/auth/providers
   - Configure SMTP settings for production email delivery

## Troubleshooting

### 401 Error on Login

**Problem**: "Invalid login credentials" or 401 status code

**Solutions**:
1. Verify user exists in Supabase Auth dashboard
2. Ensure "Auto Confirm User" was checked (email should be confirmed)
3. Double-check password is correct
4. Try resetting password in Supabase dashboard

### UUID Mismatch

**Problem**: User created with different UUID than expected

**Solution**:
1. Update `scripts/create_admin_profile.sql` with the actual UUID
2. Re-run the profile creation script

### Profile Not Found

**Problem**: Login succeeds but dashboard shows "User" instead of "Kevin Mazur"

**Solution**:
1. Check if profile exists:
   ```sql
   SELECT * FROM user_profiles WHERE email = 'kmmazur@fldandp.com';
   ```
2. If not found, re-run `create_admin_profile.sql`
3. Ensure UUIDs match between auth.users and user_profiles

### Magic Link Not Received

**Problem**: Email doesn't arrive after requesting magic link

**Solutions**:
1. Check spam folder
2. Configure custom SMTP provider in Supabase dashboard
3. For local testing, check Supabase logs for the magic link URL
4. Use password authentication instead

## Alternative Method: SQL Script

If you prefer to create the user via SQL instead of the dashboard:

1. **Open SQL Editor**: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/sql
2. **Run**: `scripts/create_supabase_auth_user.sql`
   - **IMPORTANT**: Replace `YOUR_PASSWORD_HERE` with your actual password before running
3. **Then Run**: `scripts/create_admin_profile.sql`

**Note**: The SQL method is more complex and requires understanding of PostgreSQL password encryption. The dashboard method is recommended for most users.

## Security Notes

- Never commit passwords to the repository
- Keep your `.env.local` file secure (it's gitignored)
- Admin users have full access to all features
- Regular users will have restricted permissions (to be implemented)

## Next Steps

After successful authentication:
1. Test protected routes (/dashboard, /map, /competitors, /alerts)
2. Test logout functionality
3. Deploy to Netlify with same user account
4. Add additional users as needed through Supabase dashboard

## Creating Additional Users

To add more users (staff, clients, etc.):

1. **Create Auth User** (Supabase Dashboard)
   - Go to Auth → Users → Add user
   - Enter email and password
   - Check "Auto Confirm User"
   - Click "Create user"
   - **Copy the generated UUID**

2. **Create User Profile** (SQL Editor)
   ```sql
   INSERT INTO user_profiles (
     id,
     email,
     full_name,
     role,
     default_county,
     notification_preferences,
     created_at,
     updated_at
   )
   VALUES (
     'PASTE_UUID_HERE'::uuid,
     'user@example.com',
     'User Full Name',
     'user',  -- or 'admin'
     'Hillsborough',  -- or NULL
     '{"email_alerts": true, "push_notifications": false}'::jsonb,
     NOW(),
     NOW()
   );
   ```

3. **Notify User**
   - Send them their login credentials
   - Direct them to your site URL
   - They can login immediately (email already confirmed)
