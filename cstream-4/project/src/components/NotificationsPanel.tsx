import { useCallback, useState, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Film, MessageSquare, Tv, Sparkles, Info, Check, Trash2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useI18n } from '@/lib/i18n';
import { tmdbApi } from '@/lib/tmdb';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const IMAGE_URL_REGEX = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s]*)?)/gi;
const URL_REGEX = /(https?:\/\/[^\s<>"']+)/gi;
const BOLD_REGEX = /\*\*([^*]+)\*\*/g;
const ITALIC_REGEX = /\*([^*]+)\*/g;
const CODE_REGEX = /`([^`]+)`/g;

const extractImageUrls = (text: string): string[] => {
  const matches = text.match(IMAGE_URL_REGEX);
  return matches || [];
};

const parseMarkdownText = (text: string): ReactNode[] => {
  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  
  const allMatches: { index: number; length: number; element: ReactNode }[] = [];
  
  let match;
  const boldRegex = new RegExp(BOLD_REGEX.source, 'g');
  while ((match = boldRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      element: <strong key={`bold-${key++}`} className="text-white font-bold">{match[1]}</strong>
    });
  }
  
  const italicRegex = new RegExp(ITALIC_REGEX.source, 'g');
  while ((match = italicRegex.exec(text)) !== null) {
    const isBold = allMatches.some(m => 
      m.index <= match!.index && m.index + m.length > match!.index
    );
    if (!isBold) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        element: <em key={`italic-${key++}`} className="text-white/80 italic">{match[1]}</em>
      });
    }
  }
  
  const codeRegex = new RegExp(CODE_REGEX.source, 'g');
  while ((match = codeRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      length: match[0].length,
      element: <code key={`code-${key++}`} className="bg-white/10 px-1 py-0.5 rounded text-xs text-primary">{match[1]}</code>
    });
  }
  
  const urlRegex = new RegExp(URL_REGEX.source, 'g');
  while ((match = urlRegex.exec(text)) !== null) {
    const isImage = IMAGE_URL_REGEX.test(match[0]);
    if (!isImage) {
      const overlaps = allMatches.some(m => 
        (m.index <= match!.index && m.index + m.length > match!.index) ||
        (match!.index <= m.index && match!.index + match![0].length > m.index)
      );
      if (!overlaps) {
        allMatches.push({
          index: match.index,
          length: match[0].length,
          element: (
            <a 
              key={`link-${key++}`}
              href={match[0]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:text-primary/80 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {match[0].length > 40 ? match[0].slice(0, 40) + '...' : match[0]}
            </a>
          )
        });
      }
    }
  }
  
  allMatches.sort((a, b) => a.index - b.index);
  
  const filteredMatches = allMatches.filter((m, i) => {
    for (let j = 0; j < i; j++) {
      const prev = allMatches[j];
      if (m.index >= prev.index && m.index < prev.index + prev.length) {
        return false;
      }
    }
    return true;
  });
  
  for (const m of filteredMatches) {
    if (m.index > lastIndex) {
      elements.push(text.slice(lastIndex, m.index));
    }
    elements.push(m.element);
    lastIndex = m.index + m.length;
  }
  
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  
  return elements.length > 0 ? elements : [text];
};

const MarkdownContent = ({ content, className = '' }: { content: string; className?: string }) => {
  const lines = content.split('\n');
  
  return (
    <div className={`prose prose-sm prose-invert max-w-none ${className}`}>
      {lines.map((line, i) => {
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-2 border-primary pl-2 my-1 text-white/60 italic">
              {parseMarkdownText(line.slice(2))}
            </blockquote>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="text-white/70 ml-4 list-disc">
              {parseMarkdownText(line.slice(2))}
            </li>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const text = line.replace(/^\d+\.\s/, '');
          return (
            <li key={i} className="text-white/70 ml-4 list-decimal">
              {parseMarkdownText(text)}
            </li>
          );
        }
        return (
          <p key={i} className="mb-1 last:mb-0">
            {parseMarkdownText(line)}
          </p>
        );
      })}
    </div>
  );
};

export const NotificationsPanel = ({ open, onClose }: NotificationsPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, deleteNotification, loading } = useNotifications();
  const { t } = useI18n();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const getIcon = useCallback((type: Notification['type'], mediaType?: string) => {
    if (mediaType === 'movie') return <Film className="w-5 h-5 text-red-500" />;
    if (mediaType === 'tv') return <Tv className="w-5 h-5 text-blue-500" />;
    if (mediaType === 'anime') return <Sparkles className="w-5 h-5 text-pink-500" />;
    
    switch (type) {
      case 'new_content':
        return <Film className="w-5 h-5 text-primary" />;
      case 'admin':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  }, []);

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-orange-500';
      case 'admin': return 'border-l-blue-500';
      case 'message': return 'border-l-purple-500';
      case 'new_content': return 'border-l-primary';
      default: return 'border-l-muted';
    }
  };

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.media_id && notification.media_type) {
      onClose();
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.media_id && notification.media_type) {
      const type = notification.media_type === 'anime' ? 'tv' : notification.media_type;
      return `/${type}/${notification.media_id}`;
    }
    if (notification.type === 'message' && notification.sender_id) {
      return '/chat';
    }
    return null;
  };

  const isLongMessage = (message: string) => message.length > 100;

  const handleImageClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImagePreview(url);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/80 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed right-6 bottom-6 h-[80vh] w-[400px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">{t('notifications.title')}</h2>
                    {unreadCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearNotifications}
                      className="rounded-full hover:bg-white/10 text-white/60 hover:text-red-400"
                      title="Tout supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full hover:bg-white/10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Bell className="w-16 h-16 mb-4 text-white/10" />
                    <p className="text-sm text-white/60 font-medium">{t('notifications.noNotifications')}</p>
                    <p className="text-xs text-white/40 mt-1">Les nouvelles notifications apparaîtront ici</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const link = getNotificationLink(notification);
                    const isExpanded = expandedIds.has(notification.id);
                    const isLong = isLongMessage(notification.message);
                    const imageUrls = extractImageUrls(notification.message);
                    const hasImages = imageUrls.length > 0;
                    
                    const content = (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notification.poster_path ? (
                            <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary shadow-lg">
                              <img
                                src={tmdbApi.getImageUrl(notification.poster_path, 'w200')}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                              {getIcon(notification.type, notification.media_type)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium ${isExpanded ? '' : 'line-clamp-1'} ${
                                !notification.read ? 'text-white' : 'text-white/50'
                              }`}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 animate-pulse" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-white/40" />
                              </button>
                            </div>
                          </div>
                          
                          <div className={`mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            <MarkdownContent 
                              content={notification.message} 
                              className="text-xs text-white/60"
                            />
                          </div>

                          {hasImages && isExpanded && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {imageUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => handleImageClick(url, e)}
                                  className="relative group/img overflow-hidden rounded-lg border border-white/10 hover:border-primary/50 transition-all"
                                >
                                  <img
                                    src={url}
                                    alt={`Image ${idx + 1}`}
                                    className="w-20 h-20 object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="w-4 h-4 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {hasImages && !isExpanded && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary/70">
                              <ImageIcon className="w-3 h-3" />
                              <span>{imageUrls.length} image{imageUrls.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[11px] text-white/40 flex items-center gap-2">
                              {formatDate(notification.created_at)}
                              {notification.type === 'message' && notification.sender_name && (
                                <span className="text-purple-400">De {notification.sender_name}</span>
                              )}
                            </p>
                            
                            {(isLong || hasImages) && (
                              <button
                                onClick={(e) => toggleExpand(notification.id, e)}
                                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Réduire
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Voir plus
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    const baseClasses = `group block w-full p-3 rounded-xl text-left transition-all border-l-4 ${getTypeColor(notification.type)} ${
                      !notification.read
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'hover:bg-white/5'
                    }`;

                    if (link && !isExpanded) {
                      return (
                        <Link
                          key={notification.id}
                          to={link}
                          onClick={() => handleNotificationClick(notification)}
                          className={baseClasses}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={baseClasses}
                      >
                        {content}
                      </button>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && unreadCount > 0 && (
                <div className="p-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="w-full rounded-full text-xs bg-white/5 hover:bg-white/10 text-white border-white/10 gap-2"
                    onClick={markAllAsRead}
                  >
                    <Check className="w-3 h-3" />
                    {t('notifications.markAllRead')}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-white/10">
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 rounded-full bg-black/50 hover:bg-black/70"
              >
                <X className="w-4 h-4 text-white" />
              </Button>
              <a
                href={imagePreview}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir l'original
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
