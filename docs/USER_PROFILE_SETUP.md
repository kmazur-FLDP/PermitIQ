# Setting Up Your Admin User Profile

## ✅ Your Supabase Auth UUID
```
538caddc-b2f3-499f-ab1d-507bd7243841
```

## 🔧 Step 1: Create Your Profile

Run this SQL in **Supabase SQL Editor**:

1. Go to: https://supabase.com/dashboard/project/lqiglujleojwkcwfbxmr/editor
2. Click **"New Query"**
3. Copy and paste the SQL from `scripts/create_admin_profile.sql`
4. **Update the email** with your actual email address
5. Click **"Run"**

## 📝 What This Does

Creates your user profile with:
- **UUID**: `538caddc-b2f3-499f-ab1d-507bd7243841`
- **Role**: `admin` (full access to all features)
- **Email**: Your email address (update in SQL)
- **Full Name**: Kevin Mazur
- **Default County**: Hillsborough (change if needed)
- **Notifications**: Enabled for email, hotspots, and alerts

## 🎯 After Creating Profile

You'll be able to:
1. **Sign in** to the web app with Supabase Auth
2. **Access admin features** (competitor management, alert rules, etc.)
3. **View all permits** without restrictions
4. **Manage other users** (when we build user management)
5. **Configure system settings**

## 🔑 Next Steps

### Option A: Test the Database Connection

Create a simple test page to verify your profile:

```typescript
// web/src/app/test/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', '538caddc-b2f3-499f-ab1d-507bd7243841')
    .single()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  )
}
```

Then visit: `https://your-site.netlify.app/test`

### Option B: Build Authentication

Implement Supabase Auth to allow signing in/out:
- Login page
- Session management
- Protected routes
- User menu with profile

### Option C: Build Dashboard First

Skip auth for now and build the dashboard showing permit data. Add auth later when needed.

## 🛡️ Row Level Security

Your profile is protected by RLS policies:
- You can **view your own profile**
- You can **update your own profile**
- Service role (ETL scripts) can access all profiles
- Other users can't see your data

## 📊 Database Schema

```sql
user_profiles
├── id (UUID) - Links to auth.users
├── email (VARCHAR)
├── full_name (VARCHAR)
├── role ('admin' | 'user')
├── default_county (VARCHAR)
├── notification_preferences (JSONB)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── last_login_at (TIMESTAMP)
```

## 💡 Pro Tips

1. **Keep your UUID safe** - It's your permanent user ID
2. **Admin role** gives you full access - be careful!
3. **Email must match** your Supabase Auth email (when you set it up)
4. **Notification preferences** are stored as JSON - easily customizable
5. **Default county** will pre-filter maps/searches to your area

---

**Status**: Ready to create profile in Supabase! 🚀  
**Next**: Run the SQL script in Supabase SQL Editor
