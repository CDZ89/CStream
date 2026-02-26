import React from 'react';
import { useNotificationsStore } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const NotificationCenter: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationsStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'message': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} non lues</p>}
          </div>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">✕</button>
        </div>

        {unreadCount > 0 && (
          <div className="px-4 pt-2 pb-2">
            <Button onClick={markAllAsRead} variant="outline" className="w-full text-sm">
              Marquer tout comme lu
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Aucune notification</p>
          ) : (
            notifications.map(notif => (
              <motion.div
                key={notif.id}
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                  notif.read ? 'bg-background/50 border-border' : 'bg-primary/10 border-primary/30'
                }`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{notif.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(notif.created_at).toLocaleDateString('fr')}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
