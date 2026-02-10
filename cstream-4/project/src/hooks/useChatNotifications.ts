import { useEffect, useCallback, useRef } from 'react';

interface NotificationOptions {
  senderName: string;
  message: string;
  chatId: string;
  senderAvatar?: string;
  onNotificationClick?: () => void;
}

export const useChatNotifications = () => {
  const notificationPermission = useRef<NotificationPermission | null>(null);

  // Demander la permission au chargement
  useEffect(() => {
    if ('Notification' in window) {
      notificationPermission.current = Notification.permission;

      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          notificationPermission.current = permission;
          if (permission === 'granted') {
            console.log('✅ Notifications de chat activées');
          }
        });
      }
    }
  }, []);

  const shouldNotify = useCallback((chatId: string, isCurrentChat: boolean) => {
    return (
      'Notification' in window &&
      notificationPermission.current === 'granted' &&
      !isCurrentChat &&
      document.hidden
    );
  }, []);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (!shouldNotify(options.chatId, false)) return;

    try {
      const notif = new Notification(`💬 ${options.senderName}`, {
        body: options.message.slice(0, 100),
        icon: options.senderAvatar || '/logo.svg',
        tag: `chat-${options.chatId}`,
        badge: '/logo.svg',
        requireInteraction: false,
      });

      notif.onclick = () => {
        window.focus();
        if (options.onNotificationClick) {
          options.onNotificationClick();
        }
      };

      // Fermer la notif après 5 secondes
      setTimeout(() => notif.close(), 5000);
    } catch (error) {
      console.error('Erreur notification:', error);
    }
  }, [shouldNotify]);

  const playNotificationSound = useCallback(() => {
    if ('Notification' in window && notificationPermission.current === 'granted') {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA='
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  }, []);

  const isNotificationsEnabled = useCallback(() => {
    return 'Notification' in window && notificationPermission.current === 'granted';
  }, []);

  return {
    showNotification,
    playNotificationSound,
    isNotificationsEnabled: isNotificationsEnabled(),
    notificationPermission: notificationPermission.current,
  };
};
