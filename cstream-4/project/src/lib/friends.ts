import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  friend_code: string;
}

export interface FriendRequestResult {
  success: boolean;
  error?: string;
  status?: 'sent' | 'already_friends' | 'pending' | 'reverse_pending';
}

const logFriendsError = (context: string, error: any) => {
  console.error(`[Friends Service] ${context}:`, error);
};

export const friendsService = {
  async ensureProfileExists(userId: string, email?: string): Promise<UserProfile | null> {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        if (!existingProfile.friend_code) {
          const friendCode = String(Math.floor(10000 + Math.random() * 90000));
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ friend_code: friendCode })
            .eq('id', userId)
            .select('id, username, avatar_url, friend_code')
            .single();

          if (!updateError && updatedProfile) {
            return updatedProfile;
          }
        }
        return existingProfile;
      }

      const friendCode = String(Math.floor(10000 + Math.random() * 90000));
      const username = email?.split('@')[0] || `user_${friendCode}`;

      // Use upsert to be more robust against race conditions
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username,
          friend_code: friendCode,
          avatar_url: null,
          role: 'member',
          is_admin: false
        }, { onConflict: 'id' })
        .select('id, username, avatar_url, friend_code')
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        // Retry once more in case of conflict
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, friend_code')
          .eq('id', userId)
          .single();
        if (retryProfile) return retryProfile;
      }

      return null;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      return null;
    }
  },

  async searchUsers(query: string, excludeUserId?: string): Promise<UserProfile[]> {
    if (query.length < 2) return [];

    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (excludeUserId) {
        queryBuilder = queryBuilder.neq('id', excludeUserId);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  async findProfileByIdOrCode(idOrCode: string): Promise<UserProfile | null> {
    try {
      const cleanIdOrCode = idOrCode.trim();

      // 1. Try by UUID
      const { data: byId } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code, user_code, display_code' as any)
        .eq('id', cleanIdOrCode)
        .maybeSingle();

      if (byId) {
        const p = byId as any;
        return {
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          friend_code: (p.display_code || p.user_code || p.friend_code || '').toString()
        };
      }

      const upperCode = cleanIdOrCode.toUpperCase();

      // 2. Try by all possible codes
      const { data: byAnyCode } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code, user_code, display_code' as any)
        .or(`friend_code.eq."${upperCode}",user_code.eq."${upperCode}",display_code.eq."${upperCode}"` as any)
        .maybeSingle();

      if (byAnyCode) {
        const p = byAnyCode as any;
        return {
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          friend_code: (p.display_code || p.user_code || p.friend_code || '').toString()
        };
      }

      // 3. Try by exact username (case insensitive)
      const { data: byUsername } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code, user_code, display_code' as any)
        .ilike('username', cleanIdOrCode)
        .maybeSingle();

      if (byUsername) {
        const p = byUsername as any;
        return {
          id: p.id,
          username: p.username,
          avatar_url: p.avatar_url,
          friend_code: (p.display_code || p.user_code || p.friend_code || '').toString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding profile:', error);
      return null;
    }
  },

  async checkExistingRelationship(
    userId: string,
    targetId: string
  ): Promise<{ isFriend: boolean; hasPendingRequest: boolean; hasReverseRequest: boolean }> {
    try {
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingFriendship) {
        return { isFriend: true, hasPendingRequest: false, hasReverseRequest: false };
      }

      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', userId)
        .eq('receiver_id', targetId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        return { isFriend: false, hasPendingRequest: true, hasReverseRequest: false };
      }

      const { data: reverseRequest } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', targetId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (reverseRequest) {
        return { isFriend: false, hasPendingRequest: false, hasReverseRequest: true };
      }

      return { isFriend: false, hasPendingRequest: false, hasReverseRequest: false };
    } catch (error) {
      console.error('Error checking relationship:', error);
      return { isFriend: false, hasPendingRequest: false, hasReverseRequest: false };
    }
  },

  async sendFriendRequest(
    senderId: string,
    senderProfile: UserProfile,
    targetProfile: UserProfile,
    senderEmail?: string
  ): Promise<FriendRequestResult> {
    try {
      if (senderId === targetProfile.id) {
        return { success: false, error: 'Vous ne pouvez pas vous ajouter vous-même' };
      }

      const ensuredSenderProfile = await this.ensureProfileExists(senderId, senderEmail);
      if (!ensuredSenderProfile) {
        logFriendsError('sendFriendRequest', 'Failed to ensure sender profile exists');
        return { success: false, error: "Impossible de créer votre profil. Veuillez vous reconnecter." };
      }

      const { data: freshTargetProfile, error: targetError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, friend_code')
        .eq('id', targetProfile.id)
        .maybeSingle();

      if (targetError) {
        logFriendsError('sendFriendRequest - fetch target', targetError);
      }

      if (!freshTargetProfile) {
        const targetEnsured = await this.ensureProfileExists(targetProfile.id);
        if (!targetEnsured) {
          return { success: false, error: "L'utilisateur cible n'a pas de profil valide." };
        }
      }

      // Double check: fetch again after ensuring it exists
      if (!freshTargetProfile) {
        const { data: retryTarget } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, friend_code')
          .eq('id', targetProfile.id)
          .maybeSingle();
        if (!retryTarget) {
          return { success: false, error: 'Profil cible introuvable après création' };
        }
      }

      const validTargetProfile = freshTargetProfile || targetProfile;

      // CRITICAL: Validate that receiver_id is a valid UUID and exists in auth.users
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(validTargetProfile.id)) {
        logFriendsError('sendFriendRequest', `Invalid UUID format for target: ${validTargetProfile.id}`);
        return { success: false, error: "ID utilisateur invalide. L'utilisateur n'existe peut-être pas." };
      }

      let receiverCode = validTargetProfile.friend_code;
      if (!receiverCode) {
        receiverCode = String(Math.floor(10000 + Math.random() * 90000));
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ friend_code: receiverCode })
          .eq('id', validTargetProfile.id);

        if (updateError) {
          logFriendsError('sendFriendRequest - update friend code', updateError);
        }
      }

      const relationship = await this.checkExistingRelationship(senderId, validTargetProfile.id);

      if (relationship.isFriend) {
        return { success: false, error: 'Vous êtes déjà amis avec cet utilisateur', status: 'already_friends' };
      }

      if (relationship.hasPendingRequest) {
        return { success: false, error: 'Demande déjà envoyée', status: 'pending' };
      }

      if (relationship.hasReverseRequest) {
        return { success: false, error: 'Cette personne vous a déjà envoyé une demande !', status: 'reverse_pending' };
      }

      const { error: insertError } = await supabase.from('friend_requests').insert({
        sender_id: senderId,
        receiver_id: validTargetProfile.id,
        receiver_code: receiverCode,
        status: 'pending',
      });

      if (insertError) {
        logFriendsError('sendFriendRequest - insert', insertError);

        if (insertError.code === '23505') {
          return { success: false, error: 'Une demande similaire existe déjà.', status: 'pending' };
        }
        if (insertError.message?.includes('violates row-level security')) {
          return { success: false, error: "Erreur de permissions. Veuillez vous reconnecter." };
        }

        return { success: false, error: `Erreur lors de l'envoi de la demande: ${insertError.message}` };
      }

      return { success: true, status: 'sent' };
    } catch (error: any) {
      logFriendsError('sendFriendRequest - catch', error);
      return { success: false, error: error.message || "Erreur lors de l'envoi de la demande" };
    }
  },

  async acceptFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !request) {
        return { success: false, error: 'Demande non trouvée' };
      }

      // CRITICAL: Insert friendships in BOTH directions with auth.users UUIDs
      const { error: friendshipError } = await supabase.from('friendships').insert([
        {
          user_id: request.sender_id,
          friend_id: userId,
        },
        {
          user_id: userId,
          friend_id: request.sender_id,
        }
      ]);

      if (friendshipError) {
        console.error('Friendship insert error:', friendshipError);
        return { success: false, error: "Erreur lors de l'ajout de l'ami" };
      }

      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Request update error:', updateError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: error.message };
    }
  },

  async rejectFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('receiver_id', userId);

      if (error) {
        return { success: false, error: 'Erreur lors du rejet de la demande' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      return { success: false, error: error.message };
    }
  },

  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) {
        return { success: false, error: "Erreur lors de la suppression de l'ami" };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error removing friend:', error);
      return { success: false, error: error.message };
    }
  },
};
