import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, Check, CheckCheck, Trash2, Wifi, WifiOff, 
  Database, Users, Mail, Clock, Plus, Edit, Trash, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { RealtimeNotification } from '@/hooks/useAdminRealtime';

interface RealtimeNotificationsProps {
  notifications: RealtimeNotification[];
  unreadCount: number;
  isConnected: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

const getNotificationIcon = (notification: RealtimeNotification) => {
  const eventData = notification.data;
  if (!eventData) return <Bell className="w-4 h-4" />;

  switch (eventData.table) {
    case 'readers':
      return <Database className="w-4 h-4" />;
    case 'profiles':
      return <Users className="w-4 h-4" />;
    case 'contact_messages':
      return <Mail className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getTypeIcon = (notification: RealtimeNotification) => {
  const eventType = notification.data?.type;
  switch (eventType) {
    case 'INSERT':
      return <Plus className="w-3 h-3" />;
    case 'UPDATE':
      return <Edit className="w-3 h-3" />;
    case 'DELETE':
      return <Trash className="w-3 h-3" />;
    default:
      return null;
  }
};

const getTypeColor = (type: RealtimeNotification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/30 text-green-600';
    case 'info':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600';
    case 'error':
      return 'bg-red-500/10 border-red-500/30 text-red-600';
    default:
      return 'bg-secondary';
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
};

const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: RealtimeNotification; 
  onMarkAsRead: (id: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className={cn(
      'p-3 rounded-lg border transition-colors cursor-pointer',
      notification.read 
        ? 'bg-background/50 border-border/50 opacity-70' 
        : getTypeColor(notification.type),
      !notification.read && 'hover:opacity-80'
    )}
    onClick={() => !notification.read && onMarkAsRead(notification.id)}
  >
    <div className="flex items-start gap-3">
      <div className={cn(
        'p-1.5 rounded-full flex-shrink-0',
        notification.read ? 'bg-secondary' : 'bg-white/20'
      )}>
        {getNotificationIcon(notification)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getTypeIcon(notification)}
          <p className={cn(
            'text-sm truncate',
            !notification.read && 'font-medium'
          )}>
            {notification.message}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(notification.timestamp)}
        </div>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
      )}
    </div>
  </motion.div>
));

export const RealtimeNotifications = memo(({
  notifications,
  unreadCount,
  isConnected,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear
}: RealtimeNotificationsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Activité en temps réel</CardTitle>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                  isConnected 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-red-500/10 text-red-600'
                )}>
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      Connecté
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      Déconnecté
                    </>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
                <p className="text-xs mt-1">Les activités apparaîtront ici</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] p-2">
                  <AnimatePresence>
                    <div className="space-y-2">
                      {notifications.map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={onMarkAsRead}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
                <div className="p-2 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="gap-2 text-xs"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Tout marquer comme lu
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="gap-2 text-xs text-muted-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                    Effacer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
});
