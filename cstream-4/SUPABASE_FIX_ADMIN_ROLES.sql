-- ==============================================================================
-- FIX FOR ADMIN ROLE UPDATES (NO RECURSION)
-- This script creates a SECURITY DEFINER function to safely check if a user 
-- is an admin, bypassing RLS to avoid infinite recursion. Then it adds a policy
-- allowing admins to update any profile.
-- ==============================================================================

BEGIN;

-- 1. Create a secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (is_admin = true OR role IN ('admin', 'super_admin', 'reine', 'creator'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop any existing admin policies to be clean
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Create the new policy allowing admins to update profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING ( public.is_admin() );

COMMIT;
