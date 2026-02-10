import { Badge } from '@/components/ui/badge';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';

interface UserStatusBadgeProps {
  userId: string;
  username?: string;
}

const statusConfig: Record<string, { label: string; bg: string }> = {
  online: { label: '🟢 En ligne', bg: 'bg-green-500' },
  away: { label: '🟡 Absent', bg: 'bg-yellow-500' },
  dnd: { label: '🔴 Ne pas déranger', bg: 'bg-orange-500' },
  offline: { label: '⚫ Invisible', bg: 'bg-gray-500' },
  watching: { label: '🟣 Regarde', bg: 'bg-purple-500' },
  streaming: { label: '🎬 En stream', bg: 'bg-indigo-500' },
  typing: { label: '🔵 Écrit...', bg: 'bg-blue-500' },
};

export const UserStatusBadge = ({ userId, username }: UserStatusBadgeProps) => {
  const { presence } = usePresence();
  const { role } = useAuth();

  const userPresence = presence[userId];
  const status = userPresence?.status || 'offline';
  const statusInfo = statusConfig[status] || statusConfig['offline'];

  const roleBadgeConfig: Record<string, string> = {
    super_admin: '👑 Super Admin',
    admin: '⭐ Admin',
    editor: '✏️ Editor',
    moderator: '🛡️ Mod',
    member: '👤 Member',
  };

  return (
    <div className="flex gap-1 items-center flex-wrap">
      <Badge className={`${statusInfo.bg} text-white`}>
        {statusInfo.label}
      </Badge>

      {role !== 'member' && (
        <Badge className="bg-indigo-600 text-white">
          {roleBadgeConfig[role] || 'Member'}
        </Badge>
      )}
    </div>
  );
};
