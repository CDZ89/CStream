import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Lock, Unlock, MessageCircle
} from 'lucide-react';
import { useSettingsStore } from '@/hooks/useUserSettings';
import { motion } from 'framer-motion';
import {
  UserRole,
} from '@/hooks/useAuth';
import {
  BadgeStyle,
  Permission,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  roleConfig,
  sizeClasses,
  iconSizes,
  styleClasses,
} from '@/lib/roles';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  style?: BadgeStyle;
  showSparkles?: boolean;
  showGlow?: boolean;
}

export const RoleBadge = ({
  role,
  showIcon = true,
  size = 'sm',
  className = '',
  animated = true,
  style,
  showSparkles = false,
  showGlow = false,
}: RoleBadgeProps) => {
  const storedBadgeStyle = useSettingsStore((state) => state.badgeStyle);
  const effectiveStyle = style ?? storedBadgeStyle ?? 'default';
  const config = roleConfig[role] || roleConfig.member;
  const Icon = config.icon;

  const baseClasses = `${config.className} ${sizeClasses[size]} gap-1.5 font-medium transition-all duration-300 relative z-10`;
  const animationClass = animated && role !== 'creator' ? 'badge-animated hover:scale-110' : '';
  const styleClass = styleClasses[effectiveStyle];
  const glowClass = role === 'creator' ? '' : (showGlow ? config.borderGlow : '');
  const combinedClassName = `${baseClasses} ${animationClass} ${styleClass} ${glowClass} ${className}`.trim();

  const isCreator = role === 'creator';

  return (
    <motion.div
      whileHover={{ scale: isCreator ? 1.05 : 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Badge
        variant={config.variant}
        className={combinedClassName}
      >
        {showSparkles && !isCreator && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className={`${iconSizes[size]} flex-shrink-0`} />
          </motion.div>
        )}
        {showIcon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
        <span className="truncate font-bold tracking-wide">{config.label}</span>
      </Badge>
    </motion.div>
  );
};

interface RoleCardProps {
  role: UserRole;
  showPermissions?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const RoleCard = ({
  role,
  showPermissions = false,
  compact = false,
  className = '',
  onClick,
  selected = false,
}: RoleCardProps) => {
  const config = roleConfig[role];
  const Icon = config.icon;
  const permissions = ROLE_PERMISSIONS[role];
  const permissionDetails = ALL_PERMISSIONS.filter(p => permissions.includes(p.id));

  const categories = {
    content: permissionDetails.filter(p => p.category === 'content'),
    users: permissionDetails.filter(p => p.category === 'users'),
    system: permissionDetails.filter(p => p.category === 'system'),
    moderation: permissionDetails.filter(p => p.category === 'moderation'),
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${selected
          ? `border-white/30 ${config.borderGlow}`
          : 'border-white/[0.08] hover:border-white/20'
        } ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-10`} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />

      <div className={`relative ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 10 }}
            className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} text-white`} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-white`}>
                {config.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60">
                Niveau {config.priority}
              </span>
            </div>
            <p className="text-sm text-white/50 mt-0.5">{config.description}</p>
          </div>

          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
            >
              <div className="w-3 h-3 rounded-full bg-white" />
            </motion.div>
          )}
        </div>

        {showPermissions && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/[0.06]"
          >
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(categories).map(([category, perms]) => {
                if (perms.length === 0) return null;

                const categoryLabels = {
                  content: 'Contenu',
                  users: 'Utilisateurs',
                  system: 'Système',
                  moderation: 'Modération',
                };

                const categoryColors = {
                  content: 'text-blue-400',
                  users: 'text-emerald-400',
                  system: 'text-amber-400',
                  moderation: 'text-rose-400',
                };

                return (
                  <div key={category}>
                    <h4 className={`text-xs font-semibold ${categoryColors[category as keyof typeof categoryColors]} mb-2 uppercase tracking-wider`}>
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h4>
                    <div className="space-y-1.5">
                      {perms.map(perm => {
                        const PermIcon = perm.icon;
                        return (
                          <div key={perm.id} className="flex items-center gap-2 group">
                            <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                              <PermIcon className="w-3 h-3 text-white/60" />
                            </div>
                            <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                              {perm.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

interface PermissionBadgeProps {
  permission: Permission;
  granted?: boolean;
  size?: 'sm' | 'md';
}

export const PermissionBadge = ({ permission, granted = true, size = 'sm' }: PermissionBadgeProps) => {
  const Icon = permission.icon;

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all ${granted
        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        : 'bg-red-500/10 border border-red-500/20 text-red-400'
      }`}>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}>
        {permission.name}
      </span>
      {granted ? (
        <Unlock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      ) : (
        <Lock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
    </div>
  );
};

interface DiscordBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const DiscordBadge = ({ size = 'sm', className = '' }: DiscordBadgeProps) => {
  return (
    <Badge
      variant="secondary"
      className={`bg-[#5865F2] hover:bg-[#4752C4] text-white border-0 ${sizeClasses[size]} gap-1 font-medium ${className}`}
    >
      <MessageCircle className={iconSizes[size]} />
      Discord
    </Badge>
  );
};

export default RoleBadge;
