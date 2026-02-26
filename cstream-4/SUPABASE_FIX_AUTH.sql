-- ==========================================
-- SUPABASE FIX: Database Error Saving User
-- ==========================================
-- Execute this SQL directly in Supabase SQL Editor to fix signup
-- URL: https://supabase.com/dashboard/project/fgcekgrymdcwjanwxrwj/sql/new

-- 1. CREATE profiles TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  friend_code TEXT DEFAULT '',
  role TEXT DEFAULT 'member',
  is_admin BOOLEAN DEFAULT false,
  auth_provider TEXT,
  friend_code_refreshes INTEGER DEFAULT 0,
  last_friend_code_refresh TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. DROP OLD POLICIES (if they block inserts)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 4. CREATE NEW POLICIES - CRITICAL FOR SIGNUP
-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

-- Allow users to read all profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- 6. FIX TRIGGER (if it exists) - handle_new_user function
-- This trigger should create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    avatar_url, 
    friend_code,
    auth_provider,
    is_admin,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0'),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    false,
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    avatar_url = EXCLUDED.avatar_url,
    auth_provider = EXCLUDED.auth_provider;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If trigger fails, don't block the user creation
  RAISE WARNING 'Profile creation failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- DONE! Now signup should work
-- Try signing up again in the app
-- ==========================================
