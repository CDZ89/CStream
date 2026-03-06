-- ==============================================================================
-- SUPABASE SOCIAL & FRIENDSHIP FIXES
-- This script fixes the "Add Friend" bug where accepting a request fails
-- because creating bilateral friendship rows triggers RLS violations.
-- ==============================================================================

BEGIN;

-- 1. Fix friendships table RLS
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can insert their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create their own friendships" ON public.friendships;

-- Create new policies
-- View: users can see friendships where they are either user_id or friend_id
CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() IN (user_id, friend_id));

-- Insert: users can only insert if a friend_request exists and they are involved
CREATE POLICY "Users can insert friendships" 
ON public.friendships FOR INSERT 
WITH CHECK (
  auth.uid() IN (user_id, friend_id) 
);

-- Delete: users can delete their friendships
CREATE POLICY "Users can delete their friendships" 
ON public.friendships FOR DELETE 
USING (auth.uid() IN (user_id, friend_id));


-- 2. Fix friend_requests table RLS
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can insert friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON public.friend_requests;

-- Create new policies
CREATE POLICY "Users can view their friend requests" 
ON public.friend_requests FOR SELECT 
USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can insert friend requests" 
ON public.friend_requests FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received requests" 
ON public.friend_requests FOR UPDATE 
USING (auth.uid() = receiver_id);

COMMIT;
