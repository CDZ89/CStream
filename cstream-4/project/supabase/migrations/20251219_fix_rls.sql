-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view cookie consents" ON public.cookie_consents;
DROP POLICY IF EXISTS "Users can access their own history" ON public.history;

-- Fix cookie_consents RLS
ALTER TABLE public.cookie_consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for cookie banner)
CREATE POLICY "Anyone can insert cookie consent" ON public.cookie_consents 
  FOR INSERT WITH CHECK (true);

-- No select policy (server only)
-- Admin panel uses server endpoint with authentication

-- Fix history RLS
ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own history
CREATE POLICY "Users can manage own history" ON public.history
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Readers - anyone can read
ALTER TABLE public.readers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read readers" ON public.readers FOR SELECT USING (true);
