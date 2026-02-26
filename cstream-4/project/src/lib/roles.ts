import React from 'react';
import {
    Shield, Crown, Edit3, User, Gem, MessageCircle, Sparkles, Gavel,
    Star, Zap, Eye, Settings, Users, Lock, Unlock, Bell, Database,
    FileEdit, Trash2, UserPlus, Ban, MessageSquare, BarChart3
} from 'lucide-react';
import type { UserRole } from '@/hooks/useAuth';
import { BadgeStyle } from '@/hooks/useUserSettings';

export type { BadgeStyle };

export interface Permission {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'content' | 'users' | 'system' | 'moderation';
}

export const ALL_PERMISSIONS: Permission[] = [
    { id: 'view_content', name: 'Voir le contenu', description: 'Accéder à tout le contenu', icon: Eye, category: 'content' },
    { id: 'edit_content', name: 'Modifier le contenu', description: 'Éditer les médias et métadonnées', icon: FileEdit, category: 'content' },
    { id: 'delete_content', name: 'Supprimer le contenu', description: 'Retirer des médias du catalogue', icon: Trash2, category: 'content' },
    { id: 'manage_users', name: 'Gérer les utilisateurs', description: 'Modifier les profils utilisateurs', icon: Users, category: 'users' },
    { id: 'invite_users', name: 'Inviter des utilisateurs', description: 'Envoyer des invitations', icon: UserPlus, category: 'users' },
    { id: 'ban_users', name: 'Bannir des utilisateurs', description: 'Suspendre ou bannir des comptes', icon: Ban, category: 'users' },
    { id: 'manage_roles', name: 'Gérer les rôles', description: 'Attribuer et modifier les rôles', icon: Shield, category: 'users' },
    { id: 'view_analytics', name: 'Voir les statistiques', description: 'Accéder aux tableaux de bord', icon: BarChart3, category: 'system' },
    { id: 'manage_settings', name: 'Paramètres système', description: 'Configurer l\'application', icon: Settings, category: 'system' },
    { id: 'manage_database', name: 'Base de données', description: 'Accès à la base de données', icon: Database, category: 'system' },
    { id: 'send_notifications', name: 'Notifications', description: 'Envoyer des notifications globales', icon: Bell, category: 'system' },
    { id: 'moderate_chat', name: 'Modérer le chat', description: 'Supprimer des messages', icon: MessageSquare, category: 'moderation' },
    { id: 'warn_users', name: 'Avertir les utilisateurs', description: 'Émettre des avertissements', icon: Bell, category: 'moderation' },
    { id: 'mute_users', name: 'Muter les utilisateurs', description: 'Réduire au silence temporairement', icon: Ban, category: 'moderation' },
];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    creator: ALL_PERMISSIONS.map(p => p.id),
    super_admin: ALL_PERMISSIONS.map(p => p.id),
    admin: [
        'view_content', 'edit_content', 'delete_content',
        'manage_users', 'invite_users', 'ban_users', 'manage_roles',
        'view_analytics', 'manage_settings', 'manage_database', 'send_notifications',
        'moderate_chat', 'warn_users', 'mute_users'
    ],
    moderator: [
        'view_content', 'edit_content',
        'manage_users', 'invite_users',
        'view_analytics',
        'moderate_chat', 'warn_users', 'mute_users'
    ],
    editor: [
        'view_content', 'edit_content',
        'view_analytics'
    ],
    member: [
        'view_content'
    ],
};

export const roleConfig: Record<UserRole, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    glowColor: string;
    borderGlow: string;
    priority: number;
    description: string;
    gradient: string;
}> = {
    creator: {
        label: '👑 CRÉATEUR',
        icon: Gem,
        variant: 'default',
        className: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-black font-black text-sm tracking-[0.2em] border-0 shadow-[0_0_25px_rgba(255,165,0,0.6)] ring-2 ring-yellow-300/50 transition-all duration-300 hover:shadow-orange-500/90 hover:scale-110 uppercase',
        glowColor: 'rgba(255, 165, 0, 0.8)',
        borderGlow: 'shadow-[0_0_25px_rgba(255,165,0,0.6),0_0_50px_rgba(255,165,0,0.3)]',
        priority: 100,
        description: 'Créateur exclusive - Accès total',
        gradient: 'from-yellow-400 via-orange-500 to-red-500',
    },
    super_admin: {
        label: 'Super Admin',
        icon: Crown,
        variant: 'default',
        className: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/40 ring-2 ring-amber-400/30',
        glowColor: 'rgba(245, 158, 11, 0.6)',
        borderGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.4),0_0_40px_rgba(245,158,11,0.2)]',
        priority: 90,
        description: 'Administration complète',
        gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    },
    admin: {
        label: 'Admin',
        icon: Shield,
        variant: 'destructive',
        className: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/40 ring-1 ring-red-400/20',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        borderGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.3),0_0_30px_rgba(239,68,68,0.15)]',
        priority: 80,
        description: 'Gestion du site et des utilisateurs',
        gradient: 'from-red-500 via-rose-500 to-red-600',
    },
    moderator: {
        label: 'Modérateur',
        icon: Gavel,
        variant: 'default',
        className: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white border-0 shadow-md shadow-teal-500/30 ring-1 ring-teal-400/20',
        glowColor: 'rgba(20, 184, 166, 0.5)',
        borderGlow: 'shadow-[0_0_12px_rgba(20,184,166,0.3),0_0_25px_rgba(20,184,166,0.15)]',
        priority: 70,
        description: 'Modération de la communauté',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    },
    editor: {
        label: 'Éditeur',
        icon: Edit3,
        variant: 'secondary',
        className: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white border-0 shadow-md shadow-indigo-500/30 ring-1 ring-indigo-400/20',
        glowColor: 'rgba(99, 102, 241, 0.5)',
        borderGlow: 'shadow-[0_0_12px_rgba(99,102,241,0.3),0_0_25px_rgba(99,102,241,0.15)]',
        priority: 60,
        description: 'Édition du contenu',
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
    },
    member: {
        label: 'Membre',
        icon: User,
        variant: 'outline',
        className: 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary/70',
        glowColor: 'rgba(148, 163, 184, 0.3)',
        borderGlow: '',
        priority: 10,
        description: 'Accès standard',
        gradient: 'from-zinc-500 to-zinc-600',
    },
};

export const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5',
    xl: 'text-lg px-4 py-2',
};

export const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
};

export const styleClasses: Record<BadgeStyle, string> = {
    default: '',
    shimmer: 'badge-shimmer',
    glow: 'animate-pulse',
    neon: 'shadow-[0_0_10px_currentColor]',
    minimal: 'bg-opacity-50 backdrop-blur-sm',
};

export const hasPermission = (role: UserRole, permissionId: string): boolean => {
    return ROLE_PERMISSIONS[role]?.includes(permissionId) ?? false;
};

export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
    const managerPriority = roleConfig[managerRole]?.priority ?? 0;
    const targetPriority = roleConfig[targetRole]?.priority ?? 0;
    return managerPriority > targetPriority;
};

export const getRoleHierarchy = (): UserRole[] => {
    return Object.entries(roleConfig)
        .sort(([, a], [, b]) => b.priority - a.priority)
        .map(([role]) => role as UserRole);
};
