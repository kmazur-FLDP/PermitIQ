-- Create User Profile for Kevin Mazur
-- Run this in Supabase SQL Editor

-- Insert your user profile
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    default_county,
    notification_preferences,
    last_login_at
)
VALUES (
    '538caddc-b2f3-499f-ab1d-507bd7243841'::uuid,
    'your-email@example.com',  -- Update with your actual email
    'Kevin Mazur',
    'admin',  -- Set as admin for full access
    'Hillsborough',  -- Update with your preferred default county
    '{"email": true, "hotspots": true, "alerts": true}'::jsonb,
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    role = 'admin',  -- Ensure admin role
    last_login_at = NOW(),
    updated_at = NOW();

-- Verify the profile was created
SELECT 
    id,
    email,
    full_name,
    role,
    default_county,
    created_at,
    last_login_at
FROM user_profiles
WHERE id = '538caddc-b2f3-499f-ab1d-507bd7243841'::uuid;
