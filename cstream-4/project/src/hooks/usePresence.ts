import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type UserPresenceStatus = 'online' | 'away' | 'dnd' | 'offline' | 'watching' | 'typing' | 'streaming';

export interface UserPresence {
  user_id: string;
  status: UserPresenceStatus;
  last_seen: string;
  watching_media?: { media_type: string; title: string } | null;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [presence, setPresence] = useState<Record<string, UserPresence>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Initialize presence channel
  useEffect(() => {
    if (!user?.id) return;

    const presenceChannel = supabase.channel('presence', {
      config: { broadcast: { self: true }, presence: { key: user.id } },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const newPresence: Record<string, UserPresence> = {};

      for (const [key, presenceList] of Object.entries(state)) {
        if (Array.isArray(presenceList) && presenceList.length > 0) {
          newPresence[key] = presenceList[0] as unknown as UserPresence;
        }
      }

      setPresence(newPresence);
    }).on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (newPresences.length > 0) {
        setPresence(p => ({ ...p, [key]: newPresences[0] as unknown as UserPresence }));
      }
    }).on('presence', { event: 'leave' }, ({ key }) => {
      setPresence(p => {
        const updated = { ...p };
        delete updated[key];
        return updated;
      });
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const storedStatus = localStorage.getItem('user_presence_status') as UserPresenceStatus || 'online';
        await presenceChannel.track({
          user_id: user.id,
          status: storedStatus,
          last_seen: new Date().toISOString(),
        });
      }
    });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user?.id]);

  const updateStatus = useCallback(
    async (status: UserPresenceStatus, media?: { media_type: string; title: string }) => {
      if (!channel || !user?.id) return;

      localStorage.setItem('user_presence_status', status);

      await channel.track({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString(),
        watching_media: media || null,
      });

      // Also update in database for persistence
      try {
        const { error } = await supabase.from('profiles').update({
          status,
          updated_at: new Date().toISOString(),
        } as any).eq('id', user.id);
        if (error) throw error;
      } catch (error) {
        console.error('Failed to update status in profiles:', error);
      }
    },
    [channel, user?.id]
  );

  return {
    presence,
    updateStatus,
    currentUserStatus: presence[user?.id || '']?.status || 'offline',
  };
};
