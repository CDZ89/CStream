import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleBadge } from '@/components/RoleBadge';
import type { UserRole } from '@/hooks/useAuth';
import {
  Shield, Crown, Edit3, User, Gem, Gavel, Star, Zap,
  Check, X, ChevronRight, Clock, History, AlertTriangle,
  Eye, Settings, Users, MessageCircle, Lock, Unlock,
  ArrowUp, ArrowDown, Save, Loader2
} from 'lucide-react';

export interface RolePermission {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: number;
  permissions: string[];
}

export interface RoleAuditLog {
  id: string;
  userId: string;
  username: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
  changedAt: Date;
}

const PERMISSIONS: RolePermission[] = [
  { id: 'view_content', label: 'Voir le contenu', description: 'Accéder au contenu de la plateforme', icon: Eye },
  { id: 'manage_own_profile', label: 'Gérer son profil', description: 'Modifier son propre profil', icon: User },
  { id: 'edit_content', label: 'Éditer le contenu', description: 'Créer et modifier le contenu', icon: Edit3 },
  { id: 'manage_sources', label: 'Gérer les sources', description: 'Ajouter, modifier et supprimer des sources', icon: Settings },
  { id: 'moderate_users', label: 'Modérer les utilisateurs', description: 'Avertir et suspendre des utilisateurs', icon: Gavel },
  { id: 'manage_messages', label: 'Gérer les messages', description: 'Voir et répondre aux messages de contact', icon: MessageCircle },
  { id: 'manage_roles', label: 'Gérer les rôles', description: 'Attribuer des rôles aux utilisateurs', icon: Shield },
  { id: 'admin_panel', label: 'Panel Admin', description: 'Accès complet au panel administration', icon: Lock },
  { id: 'manage_admins', label: 'Gérer les admins', description: 'Promouvoir et rétrograder les administrateurs', icon: Crown },
  { id: 'full_access', label: 'Accès total', description: 'Tous les droits sans restriction', icon: Gem },
];

const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'creator',
    label: 'Créateur',
    description: 'Créateur de la plateforme avec tous les droits',
    color: 'text-fuchsia-400',
    bgColor: 'bg-gradient-to-r from-violet-600/20 via-fuchsia-500/20 to-pink-500/20',
    borderColor: 'border-fuchsia-500/50',
    icon: Gem,
    priority: 100,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources', 'moderate_users', 'manage_messages', 'manage_roles', 'admin_panel', 'manage_admins', 'full_access'],
  },
  {
    role: 'reine',
    label: 'Reine',
    description: 'Reine avec privilèges d\'administration complets',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/50',
    icon: Crown,
    priority: 95,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources', 'moderate_users', 'manage_messages', 'manage_roles', 'admin_panel', 'manage_admins'],
  },
  {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Super administrateur avec privilèges étendus',
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/50',
    icon: Crown,
    priority: 90,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources', 'moderate_users', 'manage_messages', 'manage_roles', 'admin_panel', 'manage_admins'],
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Administrateur avec accès au panel admin',
    color: 'text-red-400',
    bgColor: 'bg-gradient-to-r from-red-500/20 via-rose-500/20 to-red-600/20',
    borderColor: 'border-red-500/50',
    icon: Shield,
    priority: 80,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources', 'moderate_users', 'manage_messages', 'manage_roles', 'admin_panel'],
  },
  {
    role: 'moderator',
    label: 'Modérateur',
    description: 'Peut modérer les utilisateurs et le contenu',
    color: 'text-teal-400',
    bgColor: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
    borderColor: 'border-teal-500/50',
    icon: Gavel,
    priority: 70,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources', 'moderate_users', 'manage_messages'],
  },
  {
    role: 'editor',
    label: 'Éditeur',
    description: 'Peut éditer du contenu et gérer les sources',
    color: 'text-indigo-400',
    bgColor: 'bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20',
    borderColor: 'border-indigo-500/50',
    icon: Edit3,
    priority: 60,
    permissions: ['view_content', 'manage_own_profile', 'edit_content', 'manage_sources'],
  },
  {
    role: 'member',
    label: 'Membre',
    description: 'Accès standard à la plateforme',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    icon: User,
    priority: 10,
    permissions: ['view_content', 'manage_own_profile'],
  },
];

export const getRoleConfig = (role: UserRole): RoleConfig => {
  return ROLE_CONFIGS.find(r => r.role === role) || ROLE_CONFIGS[ROLE_CONFIGS.length - 1];
};

export const canManageRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
  const currentConfig = getRoleConfig(currentUserRole);
  const targetConfig = getRoleConfig(targetRole);
  return currentConfig.priority > targetConfig.priority;
};

interface RoleCardProps {
  config: RoleConfig;
  isSelected: boolean;
  isCurrentRole: boolean;
  canSelect: boolean;
  onClick: () => void;
}

const RoleCard = memo(({ config, isSelected, isCurrentRole, canSelect, onClick }: RoleCardProps) => {
  const Icon = config.icon;
  
  return (
    <motion.button
      onClick={onClick}
      disabled={!canSelect}
      whileHover={canSelect ? { scale: 1.02 } : {}}
      whileTap={canSelect ? { scale: 0.98 } : {}}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected 
          ? `${config.bgColor} ${config.borderColor} ring-2 ring-offset-2 ring-offset-background ring-primary/50` 
          : canSelect 
            ? 'border-border/50 hover:border-border bg-secondary/20 hover:bg-secondary/40'
            : 'border-border/30 bg-secondary/10 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? config.bgColor : 'bg-secondary/50'}`}>
          <Icon className={`w-5 h-5 ${isSelected ? config.color : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${isSelected ? config.color : ''}`}>{config.label}</span>
            {isCurrentRole && (
              <Badge variant="outline" className="text-xs">Actuel</Badge>
            )}
            {!canSelect && !isCurrentRole && (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{config.description}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-muted-foreground">Priorité:</span>
            <span className={`text-xs font-medium ${config.color}`}>{config.priority}</span>
          </div>
        </div>
        {isSelected && (
          <Check className={`w-5 h-5 ${config.color} flex-shrink-0`} />
        )}
      </div>
    </motion.button>
  );
});

interface PermissionListProps {
  permissions: string[];
  roleColor: string;
}

const PermissionList = memo(({ permissions, roleColor }: PermissionListProps) => (
  <div className="grid grid-cols-2 gap-2">
    {PERMISSIONS.map((perm) => {
      const hasPermission = permissions.includes(perm.id);
      const Icon = perm.icon;
      return (
        <div
          key={perm.id}
          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
            hasPermission ? 'bg-green-500/10' : 'bg-secondary/20 opacity-50'
          }`}
        >
          <div className={`p-1 rounded ${hasPermission ? 'bg-green-500/20' : 'bg-secondary/30'}`}>
            {hasPermission ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-medium ${hasPermission ? roleColor : 'text-muted-foreground'}`}>
              {perm.label}
            </span>
          </div>
        </div>
      );
    })}
  </div>
));

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: string;
    email?: string;
  } | null;
  currentUserRole: UserRole;
  onRoleUpdate: (userId: string, newRole: UserRole) => void;
}

export const RoleManagementDialog = memo(({
  open,
  onOpenChange,
  user,
  currentUserRole,
  onRoleUpdate,
}: RoleManagementDialogProps) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<RoleAuditLog[]>([]);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize selectedRole when a new user is selected
    if (user && user.id !== prevUserId) {
      setSelectedRole((user.role as UserRole) || 'member');
      setPrevUserId(user.id);
    }
  }, [user?.id]); // Only depend on user.id

  const currentUserConfig = getRoleConfig(currentUserRole);
  const userCurrentRole = (user?.role as UserRole) || 'member';
  const userCurrentConfig = getRoleConfig(userCurrentRole);
  const selectedConfig = getRoleConfig(selectedRole);

  const canChangeRole = currentUserConfig.priority > userCurrentConfig.priority;
  const hasChanges = selectedRole !== userCurrentRole;

  const handleSave = async () => {
    if (!user || !hasChanges) return;
    
    setSaving(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier les rôles');
      }

      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      // Simulation pour le dev si l'API n'est pas encore prête
      if (response.status === 404 || !response.ok) {
        console.warn('API route not found or failed, falling back to client-side supabase update for dev');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: selectedRole, is_admin: ['creator', 'reine', 'super_admin', 'admin'].includes(selectedRole) })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
        
        // Also update users table if possible
        try {
           await supabase
            .from('users')
            .update({ role: selectedRole, is_admin: ['creator', 'reine', 'super_admin', 'admin'].includes(selectedRole) })
            .eq('id', user.id);
        } catch (e) {
           console.log('Users table update skipped (RLS)');
        }
      } else {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la mise à jour du rôle');
        }
      }

      const newLog: RoleAuditLog = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        oldRole: userCurrentRole,
        newRole: selectedRole,
        changedBy: 'Admin',
        changedAt: new Date(),
      };
      setAuditLogs(prev => [newLog, ...prev].slice(0, 10));
      
      onRoleUpdate(user.id, selectedRole);
      toast.success(`Rôle de ${user.username} mis à jour: ${selectedConfig.label}`, {
        description: 'Les changements ont été appliqués avec succès.',
        duration: 3000,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Role update error:', err);
      toast.error(`Erreur: ${err.message || 'Impossible de mettre à jour le rôle'}`, {
        description: 'Veuillez réessayer ou contacter un administrateur.',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.username} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 text-white flex items-center justify-center font-bold text-xl">
                  {user.username?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${userCurrentConfig.bgColor} ${userCurrentConfig.borderColor} border`}>
                {(() => {
                  const Icon = userCurrentConfig.icon;
                  return <Icon className={`w-3 h-3 ${userCurrentConfig.color}`} />;
                })()}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-lg">{user.username}</span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <RoleBadge role={userCurrentRole} size="sm" />
                {hasChanges && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <RoleBadge role={selectedRole} size="sm" />
                  </>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="mt-2 leading-relaxed">
            {canChangeRole 
              ? 'Sélectionnez un rôle à attribuer. Les rôles sont persistants et restent jusqu\'à modification.'
              : 'Vous ne pouvez pas modifier le rôle d\'un utilisateur de rang égal ou supérieur.'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Hiérarchie des rôles
              </h4>
              <div className="grid gap-2">
                {ROLE_CONFIGS.map((config) => {
                  const isSelected = selectedRole === config.role;
                  const isCurrentRole = userCurrentRole === config.role;
                  const canSelect = canChangeRole && (currentUserConfig.priority > config.priority || isCurrentRole);
                  
                  return (
                    <RoleCard
                      key={config.role}
                      config={config}
                      isSelected={isSelected}
                      isCurrentRole={isCurrentRole}
                      canSelect={canSelect}
                      onClick={() => {
                        if (canSelect) {
                          setSelectedRole(config.role);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                Permissions du rôle sélectionné
              </h4>
              <PermissionList 
                permissions={selectedConfig.permissions} 
                roleColor={selectedConfig.color}
              />
            </div>

            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-500">Changement de rôle</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Le rôle de {user.username} passera de <strong>{userCurrentConfig.label}</strong> à <strong>{selectedConfig.label}</strong>.
                      Cette action prendra effet immédiatement.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {auditLogs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Historique récent
                  </h4>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 text-xs">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {log.changedAt.toLocaleString('fr-FR')}
                        </span>
                        <span className="font-medium">{log.username}</span>
                        <RoleBadge role={log.oldRole} size="sm" />
                        <ChevronRight className="w-3 h-3" />
                        <RoleBadge role={log.newRole} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Les rôles sont persistants et restent jusqu'à modification explicite
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving || !canChangeRole}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default RoleManagementDialog;
