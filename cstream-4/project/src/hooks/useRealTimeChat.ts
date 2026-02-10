import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  created_at: string;
}

export const useRealTimeChat = (receiverId?: string, channelName: string = 'global') => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadMessages = async () => {
      try {
        let query = supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100);

        // If receiverId is provided, filter for 1:1 conversation
        if (receiverId) {
          query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`);
        }

        const { data, error: loadError } = await query;

        if (loadError) {
          console.error('[Chat] Load error:', { loadError, userId: user.id, receiverId });
          setError('Impossible de charger les messages');
          return;
        }

        if (data) {
          setMessages(data as ChatMessage[]);
        }
      } catch (error) {
        console.error('[Chat] Load exception:', error);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${channelName}:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Filter: only show messages relevant to this conversation
          if (receiverId) {
            if ((newMsg.sender_id === user.id && newMsg.receiver_id === receiverId) ||
                (newMsg.sender_id === receiverId && newMsg.receiver_id === user.id)) {
              setMessages(prev => [...prev, newMsg]);
            }
          } else {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, receiverId, channelName]);

  const sendMessage = useCallback(async (content: string, targetReceiverId?: string) => {
    // CRITICAL: Validate inputs
    if (!user?.id) {
      setError('Session invalide');
      return false;
    }

    if (!content.trim()) {
      setError('Le message ne peut pas être vide');
      return false;
    }

    const finalReceiverId = targetReceiverId || receiverId;
    if (!finalReceiverId) {
      setError('Destinataire non spécifié');
      return false;
    }

    // Guard: prevent self-messaging
    if (finalReceiverId === user.id) {
      setError('Vous ne pouvez pas vous envoyer un message');
      return false;
    }

    // Guard: prevent double-submit
    if (sending) {
      return false;
    }

    setSending(true);
    setError(null);

    // Create optimistic message
    const optimisticId = crypto.randomUUID();
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      sender_id: user.id,
      receiver_id: finalReceiverId,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // CRITICAL: Log payload before insert for debugging
      console.log('[Chat] Sending message:', {
        sender_id: user.id,
        receiver_id: finalReceiverId,
        content: content.substring(0, 50),
      });

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: finalReceiverId,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertError) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        
        console.error('[Chat] Insert error:', {
          insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          sender_id: user.id,
          receiver_id: finalReceiverId,
        });

        // Map errors to user-friendly messages
        if (insertError.code === '23503') {
          setError('Destinataire introuvable ou session expirée');
        } else if (insertError.message?.includes('row-level security')) {
          setError('Vous n\'avez pas la permission d\'envoyer ce message');
        } else {
          setError('Erreur lors de l\'envoi du message');
        }
        
        return false;
      }

      // Replace optimistic with real message
      if (data) {
        setMessages(prev => 
          prev.map(m => m.id === optimisticId ? (data as ChatMessage) : m)
        );
      }

      return true;
    } catch (error: any) {
      // Remove optimistic message on exception
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      console.error('[Chat] Send exception:', error);
      setError('Erreur réseau - veuillez réessayer');
      return false;
    } finally {
      setSending(false);
    }
  }, [user?.id, receiverId]);

  return {
    messages,
    typingUsers,
    loading,
    sending,
    error,
    sendMessage,
    clearError: () => setError(null),
  };
};
