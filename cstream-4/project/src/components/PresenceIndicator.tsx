import { usePresence } from '@/hooks/usePresence';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  userId: string;
  className?: string;
  showLabel?: boolean;
}

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  do_not_disturb: 'bg-red-500',
  watching_stream: 'bg-purple-500',
  typing: 'bg-blue-500',
  offline: 'bg-gray-500',
};

export const PresenceIndicator = ({
  userId,
  className,
  showLabel = false,
}: PresenceIndicatorProps) => {
  const { presence } = usePresence();
  const userPresence = presence[userId];
  const status = userPresence?.status || 'offline';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {status === 'typing' ? (
        <div className="flex gap-1">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className={cn('w-2 h-2 rounded-full', statusColors[status as keyof typeof statusColors])}
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            className={cn('w-2 h-2 rounded-full', statusColors[status as keyof typeof statusColors])}
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            className={cn('w-2 h-2 rounded-full', statusColors[status as keyof typeof statusColors])}
          />
        </div>
      ) : (
        <motion.div
          animate={{ scale: status === 'online' ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            'w-3 h-3 rounded-full',
            statusColors[status as keyof typeof statusColors]
          )}
        />
      )}
      {showLabel && <span className="text-sm text-gray-600">{status}</span>}
    </div>
  );
};
