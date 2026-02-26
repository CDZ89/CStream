import React from 'react';
import { usePresence, UserPresenceStatus } from '@/hooks/usePresence';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<UserPresenceStatus, { bg: string; ring: string }> = {
  online: { bg: 'bg-green-500', ring: 'ring-green-500' },
  away: { bg: 'bg-yellow-500', ring: 'ring-yellow-500' },
  dnd: { bg: 'bg-red-500', ring: 'ring-red-500' },
  offline: { bg: 'bg-gray-400', ring: 'ring-gray-400' },
  watching: { bg: 'bg-purple-500', ring: 'ring-purple-500' },
  typing: { bg: 'bg-blue-500', ring: 'ring-blue-500' },
  streaming: { bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
};

export const PresenceBadge: React.FC<{ userId: string; size?: 'sm' | 'md' | 'lg' }> = ({ userId, size = 'md' }) => {
  const { presence } = usePresence();
  const userPresence = presence[userId];
  const status = userPresence?.status || 'offline';
  const colors = STATUS_COLORS[status];

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full ${colors.bg} ring-2 ring-background absolute -bottom-0.5 -right-0.5`}
      animate={status === 'typing' ? { scale: [1, 1.2, 1] } : {}}
      transition={status === 'typing' ? { repeat: Infinity, duration: 0.6 } : {}}
      title={status}
    />
  );
};
