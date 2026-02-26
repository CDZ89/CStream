import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Moon, MinusCircle, Wifi, WifiOff } from 'lucide-react';

export type UserStatus = 'online' | 'offline' | 'dnd' | 'away';

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  animation?: string;
  glowColor?: string;
}

const STATUS_CONFIGS: Record<UserStatus, StatusConfig> = {
  online: {
    label: 'En ligne',
    color: 'bg-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/50',
    icon: Wifi,
    animation: 'animate-pulse',
    glowColor: 'shadow-green-500/50',
  },
  away: {
    label: 'Absent',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    icon: Moon,
    glowColor: 'shadow-yellow-500/30',
  },
  dnd: {
    label: 'Ne pas déranger',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    icon: MinusCircle,
    glowColor: 'shadow-orange-500/30',
  },
  offline: {
    label: 'Hors ligne',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/50',
    icon: WifiOff,
  },
};

export const determineUserStatus = (lastSeen?: string | null, explicitStatus?: UserStatus): UserStatus => {
  if (explicitStatus && explicitStatus !== 'offline') {
    return explicitStatus;
  }
  
  if (!lastSeen) {
    return 'offline';
  }
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 2) {
    return 'online';
  } else if (diffMinutes < 10) {
    return 'away';
  }
  
  return 'offline';
};

export const getStatusConfig = (status: UserStatus): StatusConfig => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.offline;
};

interface UserStatusDotProps {
  status: UserStatus;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

export const UserStatusDot = memo(({ status, size = 'md', showAnimation = true, className = '' }: UserStatusDotProps) => {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`${sizeClasses[size]} rounded-full ${config.color} ${showAnimation && status === 'online' ? config.animation : ''} ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-1.5">
            {(() => {
              const Icon = config.icon;
              return <Icon className="w-3 h-3" />;
            })()}
            {config.label}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

interface UserStatusBadgeProps {
  status: UserStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const UserStatusBadge = memo(({ status, showIcon = true, size = 'sm', className = '' }: UserStatusBadgeProps) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.borderColor} gap-1.5 ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
      } ${className}`}
    >
      {showIcon && (
        <div className={`${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full ${config.color} ${status === 'online' ? 'animate-pulse' : ''}`} />
      )}
      {config.label}
    </Badge>
  );
});

interface LastSeenDisplayProps {
  lastSeen: string | null;
  status: UserStatus;
  compact?: boolean;
}

export const LastSeenDisplay = memo(({ lastSeen, status, compact = false }: LastSeenDisplayProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSeen || status === 'online') {
        setTimeAgo('');
        return;
      }

      const now = new Date();
      const lastSeenDate = new Date(lastSeen);
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        setTimeAgo('à l\'instant');
      } else if (diffMinutes < 60) {
        setTimeAgo(`il y a ${diffMinutes}min`);
      } else if (diffHours < 24) {
        setTimeAgo(`il y a ${diffHours}h`);
      } else if (diffDays < 7) {
        setTimeAgo(`il y a ${diffDays}j`);
      } else {
        setTimeAgo(lastSeenDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [lastSeen, status]);

  if (status === 'online' || !timeAgo) {
    return null;
  }

  if (compact) {
    return (
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="w-3 h-3" />
      <span>Vu {timeAgo}</span>
    </div>
  );
});

interface UserStatusCardProps {
  username: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastSeen: string | null;
  role?: string;
  onClick?: () => void;
}

export const UserStatusCard = memo(({ 
  username, 
  avatarUrl, 
  status, 
  lastSeen, 
  role,
  onClick 
}: UserStatusCardProps) => {
  const config = getStatusConfig(status);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${config.bgColor} ${config.borderColor} hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={username} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 text-white flex items-center justify-center font-bold">
              {username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${config.color} ${status === 'online' ? 'animate-pulse' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{username}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <UserStatusBadge status={status} size="sm" showIcon={false} />
            <LastSeenDisplay lastSeen={lastSeen} status={status} compact />
          </div>
        </div>
      </div>
    </motion.button>
  );
});

interface OnlineUsersCounterProps {
  users: Array<{ status?: UserStatus }>;
  showDetails?: boolean;
}

export const OnlineUsersCounter = memo(({ users, showDetails = false }: OnlineUsersCounterProps) => {
  const statusCounts = {
    online: users.filter(u => u.status === 'online').length,
    away: users.filter(u => u.status === 'away').length,
    dnd: users.filter(u => u.status === 'dnd').length,
    offline: users.filter(u => !u.status || u.status === 'offline').length,
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium">{statusCounts.online}</span>
        <span className="text-xs text-muted-foreground">en ligne</span>
      </div>
      
      {showDetails && (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">{statusCounts.away} absents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">{statusCounts.dnd} DND</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs text-muted-foreground">{statusCounts.offline} hors ligne</span>
          </div>
        </>
      )}
    </div>
  );
});

export default UserStatusDot;
