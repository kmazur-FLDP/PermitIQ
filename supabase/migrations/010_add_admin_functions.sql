-- Migration: Add admin functions to manage users

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS admin_update_user(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_update_user(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_update_user(UUID, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS admin_delete_user(UUID);

-- 1. Function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT up.role INTO current_user_role
  FROM user_profiles up
  WHERE up.id = auth.uid();

  -- Only allow admins to see all users
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.created_at,
    up.last_login_at
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- 2. Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION admin_update_user(
  user_id UUID,
  new_full_name VARCHAR(255) DEFAULT NULL,
  new_role VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT up.role INTO current_user_role
  FROM user_profiles up
  WHERE up.id = auth.uid();

  -- Only allow admins to update users
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update the user profile
  UPDATE user_profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    role = COALESCE(new_role, role),
    updated_at = NOW()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_user(UUID, VARCHAR, VARCHAR) TO authenticated;

-- 3. Function to delete user (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT up.role INTO current_user_role
  FROM user_profiles up
  WHERE up.id = auth.uid();

  -- Only allow admins to delete users
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Don't allow deleting yourself
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;

  -- Delete the user profile
  DELETE FROM user_profiles WHERE id = user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
