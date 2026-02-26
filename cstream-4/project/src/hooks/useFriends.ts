import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  sender?: { id: string; username: string; avatar_url: string | null };
  receiver?: { id: string; username: string; avatar_url: string | null };
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend_profile?: { id: string; username: string; avatar_url: string | null };
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch friends and requests
  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [friendsRes, requestsRes] = await Promise.all([
        supabase.from('friendships').select('*').eq('user_id', user.id),
        supabase.from('friend_requests' as any).select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      ]);

      if (!friendsRes.error) setFriends((friendsRes.data as Friend[]) || []);
      if (!requestsRes.error) setRequests((requestsRes.data as unknown as FriendRequest[]) || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = useCallback(
    async (receiverId: string) => {
      if (!user?.id) return;

      try {
        // Get receiver's friend code if available
        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('friend_code')
          .eq('id', receiverId)
          .single();

        const { error } = await supabase.from('friend_requests').insert({
          sender_id: user.id,
          receiver_id: receiverId,
          receiver_code: receiverProfile?.friend_code || String(Math.floor(10000 + Math.random() * 90000)),
          status: 'pending',
        });

        if (error) throw error;
        toast.success('Demande d\'ami envoyée');
        await fetchFriends();
      } catch (error) {
        console.error('Error sending friend request:', error);
        toast.error('Erreur lors de l\'envoi');
      }
    },
    [user?.id, fetchFriends]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string, senderId: string) => {
      if (!user?.id) return;

      try {
        // Update request status
        await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);

        // Add both as friends - CRITICAL: use auth.users UUIDs via profiles.id
        await Promise.all([
          supabase.from('friendships').insert({ user_id: user.id, friend_id: senderId }),
          supabase.from('friendships').insert({ user_id: senderId, friend_id: user.id }),
        ]);

        toast.success('Ami ajouté');
        await fetchFriends();
      } catch (error) {
        console.error('Error accepting friend request:', error);
        toast.error('Erreur');
      }
    },
    [user?.id, fetchFriends]
  );

  const rejectFriendRequest = useCallback(
    async (requestId: string) => {
      try {
        await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
        toast.success('Demande refusée');
        await fetchFriends();
      } catch (error) {
        console.error('Error rejecting friend request:', error);
        toast.error('Erreur');
      }
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!user?.id) return;

      try {
        // CRITICAL: friendId must be from auth.users (via profiles.id)
        await Promise.all([
          supabase.from('friendships').delete().eq('user_id', user.id).eq('friend_id', friendId),
          supabase.from('friendships').delete().eq('user_id', friendId).eq('friend_id', user.id),
        ]);

        toast.success('Ami supprimé');
        await fetchFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
        toast.error('Erreur');
      }
    },
    [user?.id, fetchFriends]
  );

  return {
    friends,
    requests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refetch: fetchFriends,
  };
};
