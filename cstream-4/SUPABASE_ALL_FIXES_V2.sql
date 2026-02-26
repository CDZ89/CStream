-- ==============================================================================
-- COMPREHENSIVE SUPABASE FIXES (V2)
-- Execute this SQL exactly as-is in your Supabase SQL Editor
-- This will FIX the 500 errors, 409 history errors, 400 reviews error, 
-- and 404 table not found errors (user_settings, user_likes).
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. FIX INFINITE RECURSION 500 ERROR ON PROFILES
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING ( true );
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ( auth.uid() = id );

-- ==============================================================================
-- 2. FIX 409 CONFLICT ON HISTORY BY ADDING UNIQUE CONSTRAINT
-- ==============================================================================
-- Delete duplicate records if any exist before applying constraint
DELETE FROM public.history WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY user_id, tmdb_id, media_type, coalesce(season_number, -1), coalesce(episode_number, -1) ORDER BY updated_at DESC) as rnum
    FROM public.history
  ) t WHERE t.rnum > 1
);

ALTER TABLE public.history DROP CONSTRAINT IF EXISTS history_unique_constraint;

DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 150000 THEN
    ALTER TABLE public.history ADD CONSTRAINT history_unique_constraint UNIQUE NULLS NOT DISTINCT (user_id, tmdb_id, media_type, season_number, episode_number);
  ELSE
    ALTER TABLE public.history ADD CONSTRAINT history_unique_constraint UNIQUE (user_id, tmdb_id, media_type, season_number, episode_number);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if the above fails
  ALTER TABLE public.history ADD CONSTRAINT history_unique_constraint UNIQUE (user_id, tmdb_id, media_type, season_number, episode_number);
END $$;

-- ==============================================================================
-- 3. FIX REVIEWS 400 ERROR (media_id wrong type)
-- ==============================================================================
DO $$
BEGIN
  -- Check if column exists, if it does, alter it to TEXT
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='media_id') THEN
    ALTER TABLE public.reviews ALTER COLUMN media_id TYPE TEXT USING media_id::TEXT;
  ELSE
    -- If it doesn't exist, create it as TEXT
    ALTER TABLE public.reviews ADD COLUMN media_id TEXT;
  END IF;
END $$;

-- ==============================================================================
-- 4. CREATE MISSING TABLE: user_settings (FIX 404 ERROR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  notifications JSONB DEFAULT '{"newContent": true, "updates": true, "recommendations": false}'::jsonb,
  autoplay BOOLEAN DEFAULT true,
  brightness INTEGER DEFAULT 100,
  "customGradient" JSONB DEFAULT '{"enabled": false, "primaryColor": "#A855F7", "backgroundColor": "#0C0A1A"}'::jsonb,
  "displayDensity" TEXT DEFAULT 'normal',
  "badgeStyle" TEXT DEFAULT 'default',
  "snowflakesEnabled" BOOLEAN DEFAULT false,
  "snowflakeSpeed" NUMERIC DEFAULT 1,
  "snowflakeOpacity" NUMERIC DEFAULT 0.8,
  "particlesEnabled" BOOLEAN DEFAULT true,
  "enableSeasonalThemes" BOOLEAN DEFAULT true,
  "applyThemeToAll" BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 5. CREATE MISSING TABLE: user_likes (FIX 404 ERROR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, media_id, media_type)
);

ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own likes" ON public.user_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.user_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.user_likes;

CREATE POLICY "Users can view their own likes" ON public.user_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own likes" ON public.user_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.user_likes FOR DELETE USING (auth.uid() = user_id);

-- Make sure movies are readable
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view movies" ON public.movies;
CREATE POLICY "Anyone can view movies" ON public.movies FOR SELECT USING (true);


COMMIT;
