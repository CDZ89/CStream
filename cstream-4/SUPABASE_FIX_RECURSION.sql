-- ==============================================================================
-- FIX FOR INFINITE RECURSION 500 ERROR ON PROFILES
-- Run this in your Supabase SQL Editor
-- ==============================================================================

BEGIN;

-- 1. DROP the specific policy causing the infinite loop (500 Error)
-- This policy checks 'public.profiles' inside the RLS of 'public.profiles', causing a loop.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 2. Drop other potentially conflicting or duplicated policies from previous migrations
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

-- 3. RECREATE clean, safe, non-recursive RLS policies for profiles

-- Allow everyone to read profiles
CREATE POLICY "Anyone can view profiles" 
ON public.profiles FOR SELECT 
USING ( true );

-- Allow users to insert only their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

COMMIT;

-- Note on Admin Access:
-- If your frontend absolutely needs admins to update *other* people's profiles directly via the client `supabase` instance,
-- you will need to implement a SECURITY DEFINER function to check the admin status, avoiding RLS loops.
-- However, just running this script will INSTANTLY FIX the 500 crash stopping your app from working.
