-- Create Supabase Auth user for Kevin Mazur
-- Run this in Supabase SQL Editor FIRST, then run create_admin_profile.sql

-- Insert into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '538caddc-b2f3-499f-ab1d-507bd7243841'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,  -- Default instance_id
  'kmmazur@fldandp.com',
  crypt('YOUR_PASSWORD_HERE', gen_salt('bf')),  -- Replace YOUR_PASSWORD_HERE with your desired password
  NOW(),  -- Email confirmed immediately
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create identity record
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '538caddc-b2f3-499f-ab1d-507bd7243841'::uuid,
  '538caddc-b2f3-499f-ab1d-507bd7243841'::uuid,
  jsonb_build_object('sub', '538caddc-b2f3-499f-ab1d-507bd7243841'::text, 'email', 'kmmazur@fldandp.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (provider, id) DO NOTHING;

-- Verify user was created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'kmmazur@fldandp.com';
