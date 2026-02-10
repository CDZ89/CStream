import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

interface AvatarWithStatusBadgeProps {
  avatarUrl: string | null;
  username?: string;
  status?: 'online' | 'offline' | 'dnd' | 'streaming' | 'away';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const statusConfig = {
  online: { color: 'bg-green-500', emoji: '🟢' },
  offline: { color: 'bg-gray-400', emoji: '⚪' },
  dnd: { color: 'bg-orange-500', emoji: '🟠' },
  streaming: { color: 'bg-purple-500', emoji: '🟣' },
  away: { color: 'bg-yellow-500', emoji: '🟡' },
};

const sizeMap = {
  sm: { container: 'w-12 h-12', badge: 'w-3 h-3' },
  md: { container: 'w-16 h-16', badge: 'w-4 h-4' },
  lg: { container: 'w-24 h-24', badge: 'w-5 h-5' },
  xl: { container: 'w-32 h-32', badge: 'w-6 h-6' },
};

export const AvatarWithStatusBadge = ({
  avatarUrl,
  username = 'User',
  status = 'offline',
  className = '',
  size = 'md',
}: AvatarWithStatusBadgeProps) => {
  const statusInfo = statusConfig[status];
  const sizing = sizeMap[size];

  return (
    <div className={`relative ${sizing.container} ${className}`}>
      <Avatar className={`${sizing.container} ring-2 ring-primary/20`}>
        <AvatarImage
          src={avatarUrl || ''}
          alt={username}
          className="object-cover"
        />
        <AvatarFallback className="bg-gradient-to-br from-primary/70 to-primary/60 text-primary-foreground font-bold text-lg">
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Status Badge - Bottom Right */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          absolute bottom-0 right-0 
          ${sizing.badge} rounded-full
          ${statusInfo.color}
          border-2 border-card shadow-lg
          flex items-center justify-center
          transition-all duration-300
        `}
        title={`Status: ${status}`}
        whileHover={{ scale: 1.2 }}
      >
        <span className="text-[8px]">{statusInfo.emoji}</span>
      </motion.div>
    </div>
  );
};
