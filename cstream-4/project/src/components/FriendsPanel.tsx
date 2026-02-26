import React, { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, UserPlus, Trash2, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';

export const FriendsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { friends, requests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
  const { presence } = usePresence();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'watching': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Amis</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">✕</button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 border-b border-border">
          <Button
            variant={tab === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('friends')}
            className="flex-1"
          >
            Amis ({friends.length})
          </Button>
          <Button
            variant={tab === 'requests' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('requests')}
            className="flex-1"
          >
            Demandes ({requests.filter(r => r.status === 'pending').length})
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'friends' ? (
            friends.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Aucun ami pour le moment</p>
            ) : (
              friends.map(friend => {
                const friendPresence = presence[friend.friend_id];
                return (
                  <motion.div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={friend.friend_profile?.avatar_url || ''} />
                          <AvatarFallback>{friend.friend_profile?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`${getStatusColor(friendPresence?.status || 'offline')} w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-background`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{friend.friend_profile?.username}</p>
                        <p className="text-xs text-muted-foreground">{friendPresence?.status || 'offline'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => removeFriend(friend.friend_id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )
          ) : (
            requests.filter(r => r.status === 'pending').length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Aucune demande</p>
            ) : (
              requests.filter(r => r.status === 'pending').map(req => (
                <motion.div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={req.sender?.avatar_url || ''} />
                      <AvatarFallback>{req.sender?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{req.sender?.username}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-green-500 hover:text-green-600"
                      onClick={() => acceptFriendRequest(req.id, req.sender_id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => rejectFriendRequest(req.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
