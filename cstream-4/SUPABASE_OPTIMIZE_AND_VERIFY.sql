-- OPTION 1: Performance Index
-- Accelerate searches by display_code (essential for user lookups)
CREATE INDEX IF NOT EXISTS idx_users_display_code ON public.profiles(display_code);

-- OPTION 2: Verification Queries
-- Run these to confirm everything is correct

-- 1. Count users with code
SELECT COUNT(*) as users_with_code FROM public.profiles WHERE display_code IS NOT NULL;

-- 2. Sample data (check format)
SELECT id, username, display_code 
FROM public.profiles 
ORDER BY display_code DESC 
LIMIT 10;

-- 3. Check sequence health
SELECT last_value as current_sequence_value FROM friend_code_seq;
