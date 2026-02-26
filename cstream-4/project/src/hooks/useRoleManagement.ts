import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'moderator' | 'member';

export const useRoleManagement = () => {
  const { user, role: currentUserRole } = useAuth();
  const [roles, setRoles] = useState<Map<string, UserRole>>(new Map());
  const [loading, setLoading] = useState(true);

  const canManageRoles = ['super_admin', 'admin'].includes(currentUserRole);

  useEffect(() => {
    setLoading(false);
  }, [user?.id]);

  const updateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    if (!canManageRoles) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update role:', error);
      return false;
    }
  }, [canManageRoles]);

  const getUserRole = useCallback((userId: string): UserRole => {
    return roles.get(userId) || 'member';
  }, [roles]);

  return {
    roles,
    loading,
    canManageRoles,
    updateUserRole,
    getUserRole,
  };
};
