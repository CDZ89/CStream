import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence, UserPresenceStatus } from './usePresence';
import { toast } from 'sonner';

interface UseUserStatusReturn {
  status: UserPresenceStatus;
  setStatus: (status: UserPresenceStatus) => Promise<void>;
  isUpdating: boolean;
  lastSeen: string | null;
  updatePresence: () => Promise<void>;
}

export function useUserStatus(): UseUserStatusReturn {
  const { user } = useAuth();
  const { updateStatus, currentUserStatus } = usePresence();
  const [isUpdating, setIsUpdating] = useState(false);

  const setStatus = useCallback(async (newStatus: UserPresenceStatus) => {
    if (!user?.id) return;
    
    // Quick session cache for status
    const cacheKey = `status_${user.id}`;
    sessionStorage.setItem(cacheKey, JSON.stringify({ status: newStatus, timestamp: Date.now() }));
    
    setIsUpdating(true);
    try {
      await updateStatus(newStatus);
      const statusLabels: Record<string, string> = {
        online: 'En ligne',
        away: 'Absent',
        dnd: 'Ne pas déranger',
        offline: 'Invisible',
        streaming: 'En stream'
      };
      toast.success(`Statut changé: ${statusLabels[newStatus] || newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors du changement de statut');
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, updateStatus]);

  const updatePresence = useCallback(async () => {
    if (!user?.id) return;
    await updateStatus(currentUserStatus);
  }, [user?.id, updateStatus, currentUserStatus]);

  return {
    status: currentUserStatus,
    setStatus,
    isUpdating,
    lastSeen: new Date().toISOString(),
    updatePresence
  };
}

export default useUserStatus;
