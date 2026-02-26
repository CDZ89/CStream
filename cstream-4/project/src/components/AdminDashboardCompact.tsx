import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const AdminDashboardCompact = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { updateUserRole, getUserRole } = useRoleManagement();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const loadUsers = async () => {
      try {
        const { data } = await supabase.from('profiles').select('id, username, avatar_url').limit(50);
        if (data) setUsers(data as User[]);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const success = await updateUserRole(userId, newRole as any);
    if (success) {
      toast.success(`User role updated to ${newRole}`);
    } else {
      toast.error('Failed to update role');
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>👑 Admin Dashboard</span>
          {isSuperAdmin && <Badge>Super Admin</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="font-medium">{user.username}</span>
                </div>
                <Select
                  defaultValue={getUserRole(user.id)}
                  onValueChange={value => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="super_admin">👑 Super Admin</SelectItem>}
                    <SelectItem value="admin">⭐ Admin</SelectItem>
                    <SelectItem value="editor">✏️ Editor</SelectItem>
                    <SelectItem value="moderator">🛡️ Moderator</SelectItem>
                    <SelectItem value="member">👤 Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
