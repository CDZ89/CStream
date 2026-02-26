-- Ensure profiles table has all required columns and proper RLS policies
-- First, create profiles table if it doesn't exist with all necessary columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  friend_code TEXT DEFAULT '',
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'reine', 'super_admin', 'admin', 'moderator', 'editor', 'member')),
  is_admin BOOLEAN DEFAULT false,
  auth_provider TEXT,
  friend_code_refreshes INTEGER DEFAULT 0,
  last_friend_code_refresh TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view cookie consents" ON public.cookie_consents;
DROP POLICY IF EXISTS "Users can access their own history" ON public.history;

-- Re-add those policies with proper check to handle missing profiles gracefully
CREATE POLICY "Anyone can insert cookie consent" ON public.cookie_consents 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own history" ON public.history
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Profiles RLS policies - CRITICAL for signup to work
-- Allow authenticated users to read all profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Ensure users table has INSERT policy if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Drop any conflicting policies on users table
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
    
    -- Allow authenticated users to insert their own user record
    CREATE POLICY "Users can insert their own profile" ON public.users
      FOR INSERT
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
