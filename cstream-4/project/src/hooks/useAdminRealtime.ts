import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeEvent {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  new?: any;
  old?: any;
  timestamp: Date;
}

export interface RealtimeNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  data?: any;
}

export function useAdminRealtime(
  tables: string[] = ['readers', 'profiles'],
  onEvent?: (event: RealtimeEvent) => void
) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const formatEventMessage = useCallback((event: RealtimeEvent): string => {
    switch (event.table) {
      case 'readers':
        if (event.type === 'INSERT') {
          return `Nouvelle source ajoutée: ${event.new?.label || 'Source'}`;
        }
        if (event.type === 'UPDATE') {
          return `Source modifiée: ${event.new?.label || 'Source'}`;
        }
        if (event.type === 'DELETE') {
          return `Source supprimée: ${event.old?.label || 'Source'}`;
        }
        break;
      case 'profiles':
        if (event.type === 'INSERT') {
          return `Nouvel utilisateur inscrit: ${event.new?.username || 'Utilisateur'}`;
        }
        if (event.type === 'UPDATE') {
          return `Profil modifié: ${event.new?.username || 'Utilisateur'}`;
        }
        break;
      case 'contact_messages':
        if (event.type === 'INSERT') {
          return `Nouveau message de contact: ${event.new?.subject || 'Message'}`;
        }
        if (event.type === 'UPDATE') {
          return `Message mis à jour: ${event.new?.subject || 'Message'}`;
        }
        break;
    }
    return `${event.type} sur ${event.table}`;
  }, []);

  const getEventType = useCallback((event: RealtimeEvent): 'success' | 'info' | 'warning' | 'error' => {
    switch (event.type) {
      case 'INSERT':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'warning';
      default:
        return 'info';
    }
  }, []);

  useEffect(() => {
    const setupRealtime = async () => {
      try {
        const channel = supabase.channel('admin-realtime');

        tables.forEach(table => {
          channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              const event: RealtimeEvent = {
                id: crypto.randomUUID(),
                type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                table: table,
                new: payload.new,
                old: payload.old,
                timestamp: new Date()
              };

              onEvent?.(event);

              addNotification({
                message: formatEventMessage(event),
                type: getEventType(event),
                data: event
              });

              if (event.table === 'contact_messages' && event.type === 'INSERT') {
                toast.info('Nouveau message de contact reçu', {
                  description: event.new?.subject || 'Message sans sujet',
                  action: {
                    label: 'Voir',
                    onClick: () => {
                      window.dispatchEvent(new CustomEvent('admin:goto-messages'));
                    }
                  }
                });
              }
            }
          );
        });

        channel.subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

        channelRef.current = channel;
      } catch (error) {
        console.error('Erreur lors de la configuration du temps réel:', error);
        setIsConnected(false);
      }
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tables, onEvent, addNotification, formatEventMessage, getEventType]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification
  };
}
