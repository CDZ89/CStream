-- Friends system tables
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Presence & Status system
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'dnd', 'offline', 'watching', 'typing')),
  last_seen TIMESTAMPTZ DEFAULT now(),
  watching_media JSONB DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID,
  channel_name TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'message', 'status_change', 'system')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see friend requests to/from them" ON public.friend_requests FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Users can manage friend requests" ON public.friend_requests FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own friend requests" ON public.friend_requests FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can see their friends" ON public.friends FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can add friends" ON public.friends FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can see online presence" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update their own presence" ON public.user_presence FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can read messages for them" ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can see their notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can mark notifications as read" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
