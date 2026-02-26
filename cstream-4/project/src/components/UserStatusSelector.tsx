import { memo } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Moon, MinusCircle, WifiOff, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserPresenceStatus } from '@/hooks/usePresence';

interface StatusOption {
  value: UserPresenceStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'online',
    label: 'En ligne',
    icon: Wifi,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  {
    value: 'away',
    label: 'Absent',
    icon: Moon,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
  },
  {
    value: 'dnd',
    label: 'Ne pas déranger',
    icon: MinusCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
  {
    value: 'streaming',
    label: 'En stream',
    icon: Play,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500',
  },
  {
    value: 'offline',
    label: 'Invisible',
    icon: WifiOff,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
  },
];

interface UserStatusSelectorProps {
  status: UserPresenceStatus;
  onStatusChange: (status: UserPresenceStatus) => void;
  isUpdating?: boolean;
  compact?: boolean;
}

export const UserStatusSelector = memo(({ 
  status, 
  onStatusChange, 
  isUpdating = false,
  compact = false 
}: UserStatusSelectorProps) => {
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  const CurrentIcon = currentStatus.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={compact ? "sm" : "default"}
          className={`gap-2 ${compact ? 'h-8' : ''}`}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <motion.div
                key={status}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-2.5 h-2.5 rounded-full ${currentStatus.bgColor} ${status === 'online' ? 'animate-pulse' : ''}`}
              />
              {!compact && <span>{currentStatus.label}</span>}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`flex items-center gap-3 cursor-pointer ${status === option.value ? 'bg-primary/10' : ''}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${option.bgColor} ${option.value === 'online' ? 'animate-pulse' : ''}`} />
              <Icon className={`w-4 h-4 ${option.color}`} />
              <span>{option.label}</span>
              {status === option.value && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserStatusSelector.displayName = 'UserStatusSelector';

export default UserStatusSelector;
