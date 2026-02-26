-- Create readers table
CREATE TABLE IF NOT EXISTS public.readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'VOSTFR',
  tmdb_id INTEGER,
  season_number INTEGER,
  episode_number INTEGER,
  enabled BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_media_type CHECK (media_type IN ('movie', 'tv', 'anime'))
);

-- Create cookie_consents table
CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  user_email TEXT,
  consent_type TEXT DEFAULT 'all',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create history table
CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  season_number INTEGER,
  episode_number INTEGER,
  progress NUMERIC DEFAULT 0,
  language TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_media_type CHECK (media_type IN ('movie', 'tv', 'anime'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_readers_enabled ON public.readers(enabled);
CREATE INDEX IF NOT EXISTS idx_readers_media_type ON public.readers(media_type);
CREATE INDEX IF NOT EXISTS idx_readers_tmdb_id ON public.readers(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_created ON public.cookie_consents(created_at);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_tmdb_id ON public.history(tmdb_id);

-- Enable RLS
ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Policies for readers (anyone can read)
CREATE POLICY "Anyone can read readers" ON public.readers FOR SELECT USING (true);

-- Policies for cookie_consents (anyone can insert, admins can view)
CREATE POLICY "Anyone can insert cookie consent" ON public.cookie_consents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view cookie consents" ON public.cookie_consents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Policies for history (users can access their own)
CREATE POLICY "Users can access their own history" ON public.history FOR ALL USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
