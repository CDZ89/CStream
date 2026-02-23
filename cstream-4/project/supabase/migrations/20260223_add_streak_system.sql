-- ============================================================
-- CSTREAM - STREAK SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add streak columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Update existing profiles to have default streak values
UPDATE profiles 
SET current_streak = 0, longest_streak = 0 
WHERE current_streak IS NULL OR longest_streak IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_date ON profiles(last_login_date);
CREATE INDEX IF NOT EXISTS idx_profiles_current_streak ON profiles(current_streak DESC);

-- ============================================================
-- OPTIONAL: Add bio column if missing
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- ============================================================
-- OPTIONAL: Ensure history table exists with correct schema
-- ============================================================
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'anime')),
  season_number INTEGER,
  episode_number INTEGER,
  progress NUMERIC(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  language TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type, season_number, episode_number)
);

-- Enable RLS on history if not already enabled
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- RLS policies for history
DROP POLICY IF EXISTS "Users can manage own history" ON history;
CREATE POLICY "Users can manage own history" ON history
  FOR ALL USING (auth.uid() = user_id);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_history_user_updated ON history(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_tmdb ON history(user_id, tmdb_id, media_type);

-- ============================================================
-- Fix RLS on profiles - ensure authenticated users can update own streak
-- ============================================================
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- Ensure friend_requests table exists with proper columns
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage friend requests" ON friend_requests;
CREATE POLICY "Users can manage friend requests" ON friend_requests
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================
-- Ensure friendships table exists
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships" ON friendships
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Done!
SELECT 'Migration complete! Streak columns added to profiles.' as status;
